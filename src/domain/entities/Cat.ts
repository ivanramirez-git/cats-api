export interface Cat {
  id: string;
  url: string;
  width: number;
  height: number;
  breeds?: Breed[];
}

export interface Breed {
  id: string;
  name: string;
  description: string;
  temperament: string;
  origin: string;
  life_span: string;
  weight: {
    imperial: string;
    metric: string;
  };
}