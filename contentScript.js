let voices = [];
let playingPage = false;

getVoices().then((_voices) => {
  voices = _voices.filter((voice) => voice.localService);
  const voicesArr = voices.map((item) => {
    const wrap = {};
    for (const key in item) {
      wrap[key] = item[key];
    }
    return wrap;
  });
  triggerApi("setVoices", {
    voicesStr: JSON.stringify(voicesArr),
  });
});

document.addEventListener("copy", async function (e) {
  console.log("copy");
  if (playingPage) {
    return;
  }
  const enable = await triggerApi("getEnable");
  if (!enable) return;

  // 通知所有 tab 取消所有正在朗读
  await triggerApi("cancelAll");

  var result = window.getSelection(0).toString();
  speak(result);
});

function speak(result, cb) {
  return new Promise(async (resolve, reject) => {
    const index = await triggerApi("getCurrVoicesIndex");
    const volumn = await triggerApi("getVolumn");
    const rate = await triggerApi("getRate");
    const pitch = await triggerApi("getPitch");

    const msg = new SpeechSynthesisUtterance(result);
    msg.lang = "zh";
    msg.voice = voices[index];
    msg.volumn = volumn;
    msg.rate = rate;
    msg.pitch = pitch;

    msg.addEventListener("end", () => {
      cb && typeof cb === "function" && cb();
      resolve();
    });

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
  });
}

function getVoices() {
  return new Promise(function (resolve, reject) {
    let synth = window.speechSynthesis;
    let id;

    id = setInterval(() => {
      console.log("getting voices...");
      if (synth.getVoices().length !== 0) {
        console.log("got voices !!!");
        resolve(synth.getVoices());
        clearInterval(id);
      }
    }, 10);
  });
}

async function playThisPage() {
  // 通知所有 tab 取消所有正在朗读
  await triggerApi("cancelAll");

  const articleContainer = getArticleContainer();
  console.log(articleContainer);
  const allTextNode = getAllTextNodeIn(articleContainer);
  playingPage = true;
  for (let i = 0; i < allTextNode.length; i++) {
    if (!playingPage) {
      break;
    }
    await speakTextNode(allTextNode[i]);
  }
}

async function speakTextNode(textNode) {
  const text = textNode.textContent;
  const origin_bgc = getComputedStyle(textNode.parentNode).backgroundColor;
  textNode.parentNode.style.background = await triggerApi("getColor_highLight");

  function callBack() {
    textNode.parentNode.style.background = origin_bgc;
  }
  return speak(text, callBack);
}

// 搜索所有的 p ul ol, 统计他们的父元素，最多的那个为文章的容器
function getArticleContainer() {
  //   console.log("getArticleContainer v3");
  const allTextNodeInBody = getAllTextNodeIn(document.body);
  // 计算器
  const counter = new Map([]);

  allTextNodeInBody.forEach((node) => {
    recordPath(getElPath(node.parentNode));
  });
  const targetContainer = getTargetContainer();

  // 取最多文本节点的那个容器节点
  function getElPath(el) {
    const elPath = [];
    const path = [el];
    const searchEndEl = document.body;

    if (!isChildOf(el, searchEndEl)) {
      return elPath;
    }

    function search(el) {
      if (el.parentNode) {
        path.unshift(el.parentNode);
        if (el.parentNode !== searchEndEl) {
          search(el.parentNode);
        }
      }
    }    
    
    function isChildOf(child, parent) {
      var parentNode;
      if (child && parent) {
        parentNode = child.parentNode;
        while (parentNode) {
          if (parent === parentNode) {
            return true;
          }
          parentNode = parentNode.parentNode;
        }
      }
      return false;
    }
    search(el);

    path.forEach((element, index) => {
      elPath.push({
        el: element,
        layer: index,
      });
    });
    return elPath;
  }

  // 录入所有的 path
  function recordPath(elPath) {
    elPath.forEach(({ el, layer }) => {
      if (!counter.has(el)) {
        counter.set(el, {
          el,
          layer,
          count: 1,
        });
      }
    });
  }

  // 获取目标容器
  function getTargetContainer() {
    const counterArr = [];

    // 统计字节数
    for (const [key, {el, layer}] of counter) {
      counter.get(key).count = getAllTextLengthIn(el);
    }

    // 过滤，同层中保留最大count的那个
    for (const [key, { el, layer, count }] of counter) {
      for (const [_key, { el: _el, layer: _layer, count: _count }] of counter) {
        if (key !== _key) {
          if (layer === _layer) {
            if (count >= _count) {
              counter.delete(_key);
            }
          }
        }
      }
    }

    // map 转 arr
    for (const [key, item] of counter) {
      counterArr.push(item);
    }

    // 按 layer 排序
    counterArr.sort((a, b) => {
      return a.layer - b.layer;
    });
    
    // 计算落差
    let maxGap = 0;
    counterArr.map((item, index) => {
      const nextItem = counterArr[index + 1];
      if (nextItem) {
        item.gap = item.count - nextItem.count;
        if (item.gap > maxGap) {
          maxGap = item.gap;
        }
      } else {
        item.gap = 0;
      }
    });

    // 最大落差的那个容器就是目标容器
    return counterArr.find((item) => item.gap === maxGap).el;
  }

  return targetContainer;
}

// 爬取容器内所有文本
function getAllTextIn(articleContainer) {
  // 忽略容器中的 style
  const EXCEPT = ["STYLE"];
  const textContentList = [];

  function getText(container) {
    Array.from(container.childNodes).forEach((node) => {
      const isExceptType = EXCEPT.includes(node.nodeName.toUpperCase());
      if (!isExceptType) {
        if (node.childNodes.length) {
          if (node.nodeName.toUpperCase === "CODE") {
            getCodeText(node); // 特殊处理 code 标签，code的内容太多就不读了，少量内容还是可以读
          } else {
            getText(node);
          }
        } else {
          if (node.nodeType === 3) {
            textContentList.push(node.textContent);
          }
        }
      }
    });
  }

  function getCodeText(code) {
    if (code.textContent.length <= 50) {
      textContentList.push(code.childNodes[0]);
    }
  }

  getText(articleContainer);

  return textContentList.join("\n");
}

// 爬取容器内所有的文本节点
function getAllTextNodeIn(articleContainer) {
  // 忽略容器中的 style code
  const EXCEPT = ["STYLE", "CODE", "SCRIPT", "TITLE"];
  const textNodeList = [];

  function getTextNode(container) {
    Array.from(container.childNodes).forEach((node) => {
      const isExceptType = EXCEPT.includes(node.nodeName.toUpperCase());
      if (!isExceptType) {
        if (node.childNodes.length) {
          getTextNode(node);
        } else {
          if (node.nodeType === 3) {
            if (node.data !== "\n") {
              textNodeList.push(node);
            }
          }
        }
      }
    });
  }

  getTextNode(articleContainer);

  return textNodeList;
}

// 爬取容器内所有文本节点的字符长度
function getAllTextLengthIn(articleContainer){
  const textNodes = getAllTextNodeIn(articleContainer);
  let countLength = 0;
  textNodes.forEach(node=>{
    countLength += node.textContent.length
  })
  return countLength;
}

// 【 向 background 发送信息 】
function emitBackground(event_type, obj) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      JSON.stringify(
        Object.assign(obj, {
          event_type,
        })
      ),
      function (res) {
        const result = JSON.parse(res);
        if (result.status === "success") {
          resolve(result.data);
        }
      }
    );
  });
}

// 【 触发 background 的 api 】
function triggerApi(apiKey, data) {
  return emitBackground("triggerApi", Object.assign({ apiKey }, data));
}

chrome.runtime.onConnect.addListener((res) => {
  // 暂停
  if (res.name === "pause") {
    res.onMessage.addListener(() => {
      speechSynthesis.pause();
      res.postMessage("ok");
    });
  }

  // 继续
  if (res.name === "resume") {
    res.onMessage.addListener(() => {
      speechSynthesis.resume();
      res.postMessage("ok");
    });
  }

  // 中断
  if (res.name === "cancel") {
    res.onMessage.addListener(() => {
      speechSynthesis.cancel();
      playingPage = false;
      res.postMessage("ok");
    });
  }

  if (res.name === "playThisPage") {
    res.onMessage.addListener(() => {
      playThisPage();
      res.postMessage("ok");
    });
  }
});
