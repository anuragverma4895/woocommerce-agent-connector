export interface OrderLineItem{id:number;name:string;quantity:number;total:string}
export interface NormalizedOrder{id:number;number:string;status:string;currency:string;total:string;customer:{id:number;name:string;email?:string};createdAt:string;updatedAt:string;paymentMethod?:string;items:OrderLineItem[]}
export interface OrderListResult{orders:NormalizedOrder[];page:number;perPage:number;total?:number;totalPages?:number}
export interface OrderFilters{page?:number;perPage?:number;status?:string;after?:string;before?:string;customerEmail?:string;orderNumber?:string}