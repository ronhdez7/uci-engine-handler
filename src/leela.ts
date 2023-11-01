export async function initLeela() {
  let CreateLC0Worker: () => Promise<Worker>;
  let LC0Worker: any;
  const ENGINE_PATH = "lc0/lc0.js";
  const useWebWorker = typeof OffscreenCanvas !== "undefined";

  if (useWebWorker) {
    CreateLC0Worker = function () {
      return new Promise(function (resolve) {
        resolve(new Worker(ENGINE_PATH));
      });
    };
  } else {
    function readFileAsText(url: string): Promise<string> {
      return new Promise(function (resolve, reject) {
        console.info("loading " + url);
        let req = new XMLHttpRequest();
        req.open("GET", url);
        req.onload = function () {
          if (req.status == 200) resolve(req.responseText);
          else reject(Error(req.statusText));
        };
        req.onerror = function () {
          reject(Error("Network Error"));
        };
        req.send();
      });
    }

    function createWorkerScript(text: string) {
      const beg = `
const LC0Worker = function() {
  
  let worker = {
    
    postMessage: function(message) {
      if (!onmessage) return;
      onmessage({data: message});
    },
    
    terminate: function() { /* TODO */},
    
    onmessage: null,

    onerror: null,

  };
  
  function postMessage(message) {
    
    let callback=worker.onmessage;
    if (!callback) return;
    callback({data: message});
  }
  
  function setTerminate(callback) {
    worker.terminate=callback;
  }
  
  `;

      let end = `
  return worker;
};

`;

      let scriptText = beg + text + end;
      return { id: "lc0", text: scriptText };
    }

    function loadScript(params: {
      id: string;
      text: string;
      url?: string;
    }): Promise<void> {
      return new Promise(function (resolve, reject) {
        let elementId = "__script__" + params.id;
        if (document.getElementById(elementId)) {
          resolve();
          return;
        }

        const head =
          document.getElementsByTagName("head")[0] || document.documentElement;
        const script = document.createElement("script");
        script.id = elementId;
        script.type = "text/javascript";
        if (params.url) {
          script.src = params.url;
          script.onload = function () {
            resolve();
          };
          script.onerror = function () {
            reject("could not load " + params.url);
          };
        }
        if (params.text) {
          script.text = params.text;
        }
        head.appendChild(script);
        if (params.text) {
          resolve();
        }
      });
    }

    CreateLC0Worker = function () {
      return new Promise(function (resolve, reject) {
        readFileAsText(ENGINE_PATH)
          .then(createWorkerScript)
          .then(loadScript)
          .then(function () {
            resolve(new LC0Worker());
          })
          .catch(function (err) {
            reject(err);
          });
      });
    };
  }

  // const WEIGHT_URL = "weights_9155.txt.gz";

  // function logger(data: any) {
  //   console.log(data);
  // }

  const worker = await CreateLC0Worker();
  // .then((worker) => {
  //   worker.onmessage = logger;
  //   worker.onerror = logger;

  // worker.postMessage(`load ${WEIGHT_URL}`);
  //   console.log(worker.postMessage("uci"));
  //   worker.postMessage("position startpos");
  // })
  // .catch(console.log);
  return worker;
}
