const ControlChar = "\x1B[";

export namespace BashStyle {
  export enum Color {
    primary = "34",
    gray = "90",
    red = "91",
    green = "92",
    yellow = "93",
    blue = "94",
    magenta = "95",
    cyan = "96",
  }

  export enum Font {
    bold = "1",
    dim = "2",
    underline = "4",
    blink = "5",
    reverse = "7",
  }

  type Style = Color | Font;

  export function style(msg: string, style: Style | Style[] | string | string[]) {
    return `${ControlChar}${style instanceof Array ? style.join(";") : style}m${msg}${ControlChar}0m`;
  }
}
