let bg = null;
const vm = new Vue({
  el: "#app",
  data: {
    enable: true,
    volumn: 1,
    rate: 1,
    pitch: 1,
    color_hex: "#0000ff",
    color_opacity: 0.15,
    voices: [],
    modes: [],
    currVoicesIndex: 0,
    currModesIndex: 0,
    reset: {
      enable: true,
      volumn: 1,
      rate: 1,
      pitch: 1,
      currVoicesIndex: 0,
      currModesIndex: 0,
      color_hex: "#0000ff",
      color_opacity: 0.15,
      color_highLight: "#0000ff26",
    },
  },
  computed: {
    color_highLight() {
      return (
        this.color_hex +
        {
          "1.00": "FF",
          0.99: "FC",
          0.98: "FA",
          0.97: "F7",
          0.96: "F5",
          0.95: "F2",
          0.94: "F0",
          0.93: "ED",
          0.92: "EB",
          0.91: "E8",
          "0.90": "E6",
          0.89: "E3",
          0.88: "E0",
          0.87: "DE",
          0.86: "DB",
          0.85: "D9",
          0.84: "D6",
          0.83: "D4",
          0.82: "D1",
          0.81: "CF",
          "0.80": "CC",
          0.79: "C9",
          0.78: "C7",
          0.77: "C4",
          0.76: "C2",
          0.75: "BF",
          0.74: "BD",
          0.73: "BA",
          0.72: "B8",
          0.71: "B5",
          "0.70": "B3",
          0.69: "B0",
          0.68: "AD",
          0.67: "AB",
          0.66: "A8",
          0.65: "A6",
          0.64: "A3",
          0.63: "A1",
          0.62: "9E",
          0.61: "9C",
          "0.60": "99",
          0.59: "96",
          0.58: "94",
          0.57: "91",
          0.56: "8F",
          0.55: "8C",
          0.54: "8A",
          0.53: "87",
          0.52: "85",
          0.51: "82",
          "0.50": "80",
          0.49: "7D",
          0.48: "7A",
          0.47: "78",
          0.46: "75",
          0.45: "73",
          0.44: "70",
          0.43: "6E",
          0.42: "6B",
          0.41: "69",
          "0.40": "66",
          0.39: "63",
          0.38: "61",
          0.37: "5E",
          0.36: "5C",
          0.35: "59",
          0.34: "57",
          0.33: "54",
          0.32: "52",
          0.31: "4F",
          "0.30": "4D",
          0.29: "4A",
          0.28: "47",
          0.27: "45",
          0.26: "42",
          0.25: "40",
          0.24: "3D",
          0.23: "3B",
          0.22: "38",
          0.21: "36",
          "0.20": "33",
          0.19: "30",
          0.18: "2E",
          0.17: "2B",
          0.16: "29",
          0.15: "26",
          0.14: "24",
          0.13: "21",
          0.12: "1F",
          0.11: "1C",
          "0.10": "1A",
          0.09: "17",
          0.08: "14",
          0.07: "12",
          0.06: "0F",
          0.05: "0D",
          0.04: "0A",
          0.03: "08",
          0.02: "05",
          0.01: "03",
          "0.00": "00",
        }[new Number(this.color_opacity).toFixed(2)]
      );
    },
  },
  watch: {
    enable(nv) {
      bg.update_enable(nv);
      if (nv === false) {
      }
    },
    currVoicesIndex(nv) {
      bg.update_currVoicesIndex(nv);
    },
    rate(nv) {
      bg.update_rate(nv);
    },
    pitch(nv) {
      bg.update_pitch(nv);
    },
    color_highLight(nv) {
      bg.update_color_hex(this.color_hex);
      bg.update_color_opacity(this.color_opacity);
      bg.update_color_highLight(nv);
    },
  },
  methods: {
    setEnable(value) {
      this.enable = value;
      this.cancelAll();
    },
    reset() {
      this.enable = this.reset.enable;
      this.rate = this.reset.rate;
      this.pitch = this.reset.pitch;
      this.currVoicesIndex = this.reset.currVoicesIndex;
    },
    async playThisPage() {
      const currTabId = await getCurrentTabId();
      const connect = chrome.tabs.connect(currTabId, { name: "playThisPage" });
      connect.postMessage("playThisPage");
    },
    async pause() {
      const currSpeakTabId =
        chrome.extension.getBackgroundPage().data.currSpeakTabId;
      const connect = chrome.tabs.connect(currSpeakTabId, { name: "pause" });
      connect.postMessage("pause");
    },
    async resume() {
      const currSpeakTabId =
        chrome.extension.getBackgroundPage().data.currSpeakTabId;
      const connect = chrome.tabs.connect(currSpeakTabId, { name: "resume" });
      connect.postMessage("resume");
    },
    async cancelAll() {
      const allTabs = await getAllTabs();
      allTabs.map((tab) => {
        const connect = chrome.tabs.connect(tab.id, { name: "cancel" });
        connect.postMessage("cancel");
      });
      bg.update_currSpeakTabId(null);
    },
  },
  mounted() {
    bg = chrome.extension.getBackgroundPage();
    const {
      enable,
      voices,
      currVoicesIndex,
      modes,
      currModesIndex,
      rate,
      pitch,
      color_hex,
      color_opacity,
    } = bg.data;
    this.enable = enable;
    this.rate = rate;
    this.pitch = pitch;
    this.voices = voices;
    this.modes = modes;
    this.color_hex = color_hex;
    this.color_opacity = color_opacity;
    this.currVoicesIndex = currVoicesIndex;
    this.currModesIndex = currModesIndex;
  },
});

/**
 * ???????????? tab ID
 */
function getCurrentTabId() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      resolve(tabs.length ? tabs[0].id : null);
    });
  });
}

/* 
  ??????????????? tabId
*/
function getAllTabs() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, function (tabs) {
      resolve(tabs);
    });
  });
}
