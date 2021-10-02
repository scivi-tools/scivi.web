declare function ADD_VISUAL(a: HTMLElement): void;
declare function PROCESS(): void;
declare var IN_VISUALIZATION: boolean;
declare var CACHE: Record<string, any>;
declare var DATA: Record<string, any>;
declare var PROPERTY: Inputs & Settings;
declare type Quaternion = {
  x: number;
  y: number;
  z: number;
  w: number;
  [0]: number;
  [1]: number;
  [2]: number;
  [3]: number;
};
declare type Grid = Array<Array<any>>;
