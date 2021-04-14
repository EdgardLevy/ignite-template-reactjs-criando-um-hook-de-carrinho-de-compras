import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {


  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  // useEffect(() => {
  //   async function loadStock(): Promise<void> {

  //     const { data } = await api.get<Stock[]>(`stock`)
  //     setStock(data)

  //   }

  //   loadStock()
  // }, [])

  const addProduct = async (productId: number) => {
    try {
      // TODO

      const updatedCard = [...cart];
      const productExists = updatedCard.find(product=>product.id === productId)

      const { data: stockProduct } = await api.get<Stock>(`stock/${productId}`)

      const stockAmount = stockProduct.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }


      if (!productExists) {

        const { data: product } = await api.get<Product>(`products/${productId}`)
        // console.log('caiu aqui')
        product.amount = 1

        const cartUpdated = [...cart, product]
        // console.log('cartUpdated', cartUpdated)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))
        setCart(cartUpdated)
      }
      else {

        const cartUpdated = cart.map(product => {
          if (product.id === productId) {
            product.amount += 1
          }
          return product
        })

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))
        setCart(cartUpdated)
      }
      // }else {
      //   toast.error('Quantidade solicitada fora de estoque');
      // }


    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const productIdx = cart.findIndex(product => product.id === productId)

      if (productIdx === -1) {
        throw new Error('Erro na remoção do produto')
      }

      const cartUpdated = cart.filter(product => product.id !== productId)

      setCart(cartUpdated)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO

      const productIdx = cart.findIndex(product => product.id === productId)

      if (productIdx === -1) {
        throw new Error('Erro na alteração de quantidade do produto')
      }

      if (amount <= 0) {
        return
      }

      const { data: stockProduct } = await api.get<Stock>(`stock/${productId}`)

      const currentItem = cart.find(product => product.id === productId)

      if (currentItem && stockProduct) {
        if (currentItem.amount + 1 > stockProduct.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }
      }

      const cartUpdated = cart.map(product => {
        if (product.id === productId) {
          product.amount = amount
        }
        return product
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))
      setCart(cartUpdated)

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
