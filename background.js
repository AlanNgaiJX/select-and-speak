var data = {
  enable: true,
  voices: [],
  modes: [
    {
      id: 0,
      name: "默认",
    },
    {
      id: 1,
      name: "智能",
    },
    {
      id: 2,
      name: "掘金",
    },
    {
      id: 3,
      name: "简书",
    },
    {
      id: 4,
      name: "百度新闻",
    },
  ],
  color_hex: "#0000ff",
  color_opacity: 0.15,
  color_highLight: "#0000ff26",
  currVoicesIndex: 0,
  currModesIndex: 0,
  volumn: 1,
  rate: 1,
  pitch: 1,
  currSpeakTabId: null,
};

function update_currVoicesIndex(nv) {
  data.currVoicesIndex = nv;
}

function update_currModesIndex(nv) {
  data.currModesIndex = nv;
}

function update_volumn(nv) {
  data.volumn = nv;
}

function update_rate(nv) {
  data.rate = nv;
}

function update_pitch(nv) {
  data.pitch = nv;
}

function update_enable(nv) {
  data.enable = nv;
}

function update_currSpeakTabId(nv) {
  data.currSpeakTabId = nv;
}

function update_color_hex(nv) {
  data.color_hex = nv;
}

function update_color_opacity(nv) {
  data.color_opacity = nv;
}

function update_color_highLight(nv) {
  data.color_highLight = nv;
}

chrome.runtime.onInstalled.addListener(function () {
  // 设置当访问指定域名时 pageAction 才可用
  setPageActionRule();

  // 部署 api 接口
  initApi();
});

// 【 api，必须返回值，或 promise对象 】
const api = {
  getEnable: function () {
    return new Promise((resolve) => {
      resolve(data.enable);
    });
  },
  setVoices: function ({ voicesStr }) {
    return new Promise((resolve, reject) => {
      data.voices = JSON.parse(voicesStr);
      resolve();
    });
  },
  getCurrVoicesIndex: function () {
    return new Promise((resolve) => {
      resolve(data.currVoicesIndex);
    });
  },
  getVolumn: function () {
    return new Promise((resolve) => {
      resolve(data.volumn);
    });
  },
  getPitch: function () {
    return new Promise((resolve) => {
      resolve(data.pitch);
    });
  },
  getRate: function () {
    return new Promise((resolve) => {
      resolve(data.rate);
    });
  },
  getCurrSpeakTabId: function () {
    return new Promise((resolve) => {
      resolve(data.currSpeakTabId);
    });
  },
  getColor_highLight: function () {
    return new Promise((resolve) => {
      resolve(data.color_highLight);
    });
  },
  cancelAll({}, sender) {
    return new Promise(async (resolve) => {
      const allTabs = await getAllTabs();
      allTabs.map((tab) => {
        const connect = chrome.tabs.connect(tab.id, { name: "cancel" });
        connect.postMessage("cancel");
      });
      data.currSpeakTabId = sender.tab.id;
      resolve();
    });
  },
};

// 【 设置当访问指定域名时 pageAction 才可用 】
function setPageActionRule() {
  const rule_1 = {
    conditions: [
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { schemes: ["https", "http"] },
      }),
    ],
    actions: [new chrome.declarativeContent.ShowPageAction()],
  };

  // 添加的规则会在浏览器重新启动时保存，因此请按如下方式注册它们:
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([rule_1]);
  });
}

// 【 部署 Api 】
function initApi() {
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    try {
      message = JSON.parse(request);
      if (
        message &&
        typeof message === "object" &&
        message.event_type === "triggerApi"
      ) {
        function sendSuccessResponse(data = {}) {
          sendResponse(
            JSON.stringify(
              Object.assign(
                {
                  data,
                },
                {
                  status: "success",
                }
              )
            )
          );
        }

        const params = message;
        const apiKey = params.apiKey;
        delete params.apiKey;
        delete params.event_type;

        execApi(apiKey, params, sendSuccessResponse, sender);

        return true;
      }
    } catch (error) {
      // 不是 JSON 字符串的情况下，解析为字符串
      message = request;
    }
  });
}

// 【 执行 Api 】
function execApi(apiKey, params, sendSuccessResponse, sender) {
  const result = api[apiKey](params, sender);
  if (result instanceof Promise) {
    result.then((data) => {
      sendSuccessResponse(data);
    });
  } else {
    sendSuccessResponse(result);
  }
}

/**
 * 获取当前 tab ID
 */
function getCurrentTabId() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      resolve(tabs.length ? tabs[0].id : null);
    });
  });
}

/* 
  获取所有的 tabId
*/
function getAllTabs() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, function (tabs) {
      resolve(tabs);
    });
  });
}
