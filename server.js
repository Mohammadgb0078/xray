const express = require("express");
const app = express();
// const port = process.env.PORT || 3000;
const port = 3000;
var exec = require("child_process").exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
var fs = require("fs");
var path = require("path");

app.get("/", (req, res) => {
  res.send(" HI :)");
});

//Get the Process Tables
app.get("/status", (req, res) => {
  let cmdStr = "ps -ef";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>Output：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>Output：\n" + stdout + "</pre>");
    }
  });
});

//启动web
app.get("/start", (req, res) => {
  let cmdStr =
    "chmod +x ./web.js && ./web.js -c ./config.json >/dev/null 2>&1 &";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("Output：" + err);
    } else {
      res.send("Output：" + "Start Compeleted!");
    }
  });
});

//Getting Server Information
app.get("/info", (req, res) => {
  let cmdStr = "cat /etc/*release | grep -E ^NAME";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("CmdError：" + err);
    } else {
      res.send(
        "Output\n" +
          "Linux System " +
          stdout +
          "\nRAM:" +
          os.totalmem() / 1000 / 1000 +
          "MB"
      );
    }
  });
});


app.get("/test", (req, res) => {
  fs.writeFile("./test.txt", "Here is the newly created file content!", function (err) {
    if (err) res.send("Create Failed!,code permission is read-only：" + err);
    else res.send("File Created Succed!");
  });
});


app.get("/download", (req, res) => {
  download_web((err) => {
    if (err) res.send("Download Failed");
    else res.send("Download Succed!");
  });
});

/* VMess WebSocket Tunnel */
app.use("/api", createProxyMiddleware({
    target: "http://127.0.0.1:8080/", // the target address of xray server
    changeOrigin: true, // The default is false, whether to change the original host header to the target URL
    ws: true, // Don't edit
    pathRewrite: {
      // Remove /api from the request
      "^/api": "/qwe",
    },
    onProxyReq: function onProxyReq(proxyReq, req, res) {},
  })
);

/* keepalive  begin */
function keepalive() {
  // 1.put Your live site url
  let render_app_url = "https://" + process.env.PROJECT_DOMAIN + ".glitch.me";
  exec("curl " + render_app_url, function (err, stdout, stderr) {
    if (err) {
      console.log("Keep Alive-Command Line Execution Error：" + err);
    } else {
      console.log("Keep alive Succed=response message:" + stdout);
    }
  });

  exec("curl " + render_app_url + "/status", function (err, stdout, stderr) {
    if (!err) {
      if (stdout.indexOf("./web.js -c ./config.json") != -1) {
        console.log("Web Server is Working");
      } else {
//This is just space
        exec(
          "chmod +x ./web.js && ./web.js -c ./config.json >/dev/null 2>&1 &",
          function (err, stdout, stderr) {
            if (err) {
              console.log("Keep Alive-Invoke Web-CommandLine Error：" + err);
            } else {
              console.log("Keep alive-start web-CmdLine successfully!");
            }
          }
        );
      }
    } else console.log("Keep Alive - Request Server Process Table - Command Line Execution Error: " + err);
  });
}
setInterval(keepalive, 35000);

/* keepalive  end */

// Initialize, download web
function download_web(callback) {
  let fileName = "web.js";
  let url =
    "https://cdn.glitch.me/53b1a4c6-ff7f-4b62-99b4-444ceaa6c0cd/web?v=1673588495643";
  let stream = fs.createWriteStream(path.join("./", fileName));
  request(url)
    .pipe(stream)
    .on("close", function (err) {
      if (err) callback("Failed To download file");
      else callback(null);
    });
}
download_web((err) => {
  if (err) console.log("Initialization - Failed to download web file");
  else console.log("Initialization - Download web file successfully");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));