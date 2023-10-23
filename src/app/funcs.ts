export interface rowData {
    name : string;
    value : number;
    unit : string;
};

export interface Condition{
    Shot:number;
}
export interface role {
    name : string,
    role : string
}
export const CHrolesC : string[] = ["Pc"];
export const CHrolesS : string[] = ["Pm1", "Pm2", "Pl1", "Pl2","pitot"];
export const CHrolesP : string[] = ["pI", "pQ"];
export const CHrolesR : string[] = ["rI", "rQ"];
export const CHroles : string[] = [...CHrolesC, ...CHrolesS.slice(0, -1), ...CHrolesP, ...CHrolesR, "pitot","×"];
export interface roles {
    compRole : role[],
    shockRole : role[],
    pistonRole : role[],
    ruptRole : role[]
}

export const GasName : string[] = ["Air", "N2", "He", "×"];
export const mats = ["Al", "spcc", "PLA", "ABS"];

export function getWp(name: string){
  let Wp = 10;
  if(name == "SUS"){
    Wp = 0.99;
  }
  else if(name == "Al"){
    Wp = 0.28;
  }
  else if(name == "MC60"){
    Wp = 0.17;
  }
  return Wp;
}

export function getPistonMat(wp : number){
  let name = "";
  switch(wp){
    case 0.28:
      name = "Al";
      break;
    case 0.99:
      name = "SUS";
      break;
    case 0.17:
      name = "MC60";
      break;
  }
  return name;
}

export function getKappaM(name : string) {
    let kappa = 10e4;
    let M = 2e4;      
    if(name == "Air"){
        kappa = 1.4;
        M = 28.8;
    }else if(name == "N2"){
        kappa = 1.4;
        M = 28;
    }else if(name == "He"){
        kappa = 1.67;
        M = 4;
    }
    return {kappa, M};
}

export function getNameFromM(M : number){
    let name = "×";   
    if(M == 28.8){
        name = "Air"
    }else if(M == 28){
        name = "N2"
    }else if(M == 4){
        name = "He"
    }
    return name;
}

export function senkeiKinji(x1: number, x2: number, y1: number, y2: number, x: number): number {
    const y = ((y2 - y1) / (x2 - x1)) * (x - x1) + y1;
    console.log("x1:", x1, "x2:", x2, "y1:",y1, "y2:",y2, "x:", x, "y:", y);
    return y;
}

export function senkeiKinjix(x1: number, x2: number, y1: number, y2: number, y: number): number {
    const x = ((x2 - x1) / (y2 - y1)) * (y - y1) + x1;
    console.log("x1:", x1, "x2:", x2, "y1:",y1, "y2:",y2, "x:", x, "y:", y);
    return x;
}