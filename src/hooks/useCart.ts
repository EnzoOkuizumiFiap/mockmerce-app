import { getCart } from "@/services/cart";
import { useQuery } from "@tanstack/react-query";

export function useCart() {
  return useQuery({
    queryKey: ["cart"],
    queryFn: getCart
  })
}