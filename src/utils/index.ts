
export interface StackInfo {
  trigger: string;
  addr: string;
  row: number;
  col: number;
}
export function stackParsing() {
  const result: StackInfo[] = [];
    const reg = /(?<=at\s)([^(]+) \(([^(]+):(\d+):(\d+)(?=\))/gim;

    const obj = Object.create(null);
    Error.captureStackTrace(obj);

    let execR = reg.exec(<string>obj.stack);
    while (execR) {
      result.push({
        trigger: execR[1],
        addr: execR[2],
        row: Number(execR[3]),
        col: Number(execR[4]),
      });

      execR = reg.exec(<string>obj.stack);
    }

    return result;
}

export * from "./bash-style";