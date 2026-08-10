import { listProducts, ListProductsParams } from "@/services/products";
import { useQuery } from "@tanstack/react-query";

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: ["products", "list", params],
    queryFn: async () => {
      const response = await listProducts(params);

      return response.data;
    }
  })
}