export interface RealFevrPack {
  packId: number;
  initialNFTID: number;
  price: string | number;
  serie: string;
  drop: string;
  packType: string;
  buyer: string;
  saleDistributionAddresses: string[];
  saleDistributionAmounts: number[];
  opened: boolean
}
