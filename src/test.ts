import { Log } from ".";

const customLog = new Log();

const rootLog = new Log("root", {
  levels: {
    debug: false,
  },
  file: {
    filename: "{date(yyyy-mm-dd)}.log"
  },
  custom: {
    onPrint(info) {
      customLog.info(info);
    }
  }
});

const eLog = rootLog.getDeriveLog("eLog");

eLog.info("测试测试");
eLog.debug("测试测试");
eLog.error("测试测试");
eLog.warn("测试测试");

const iLog = rootLog.getDeriveLog("iLog");
iLog.info("测试测试");
eLog.debug("测试测试");
eLog.error("测试测试");
eLog.warn("测试测试");