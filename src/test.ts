import { Log } from ".";

const rootLog = new Log();

const eLog = rootLog.getDeriveLog("eLog");

eLog.info("测试测试");
eLog.debug("测试测试");
eLog.error("测试测试");
eLog.warn("测试测试");