import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
export default function Home({
  account,
  marketplace,
  standardToken,
  specialToken,
}) {
  const [loadingNormal, setLoadingNormal] = useState(true);
  const [loadingSpecial, setLoadingSpecial] = useState(true);

  const [items, setItems] = useState([]);

  const loadMarketplaceItems = async () => {
    const totalitemCount = await marketplace.itemCount();
    const specialitemCount = await marketplace.specialItemCount();
    const normalitemCount = totalitemCount - specialitemCount;
    console.log(normalitemCount);
    console.log(specialitemCount);
    let items = [];
    for (let i = 1; i <= normalitemCount; i++) {
      const item = await marketplace.items(i);
      if (!item.sold) {
        // get uri url from nft contract
        const uri = await standardToken.tokenURI(item.tokenId);
        // use uri to fetch the nft metadata stored on ipfs
        const response = await fetch(uri);
        const metadata = await response.json();

        // get total price of item (item price + fee)
        const totalPrice = await marketplace.getTotalPrice(item.itemId);
        // add item to items array
        console.log(totalPrice);
        items.push({
          totalPrice,
          itemId: item.tokenId,
          seller: item.seller,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          category: metadata.category,
          isStandard: true,
        });
      }
    }
    setLoadingNormal(false);
    setItems(items);
    for (let i = 1; i <= specialitemCount; i++) {
      const item = await marketplace.exchangedItems(i);
      if (!item.sold) {
        // get uri url from nft contract
        const uri = await specialToken.tokenURI(item.tokenId);
        // use uri to fetch the nft metadata stored on ipfs
        const response = await fetch(uri);
        const metadata = await response.json();

        // get total price of item (item price + fee)
        const totalPrice = await marketplace.getTotalPrice(item.itemId);
        // add item to items array

        items.push({
          totalPrice,
          itemId: item.tokenId,
          seller: item.seller,
          name: metadata.name,
          description: metadata.description,
          image: metadata.image,
          category: metadata.category,
          isStandard: false,
        });
      }
    }
    setLoadingSpecial(false);
    setItems(items);
  };

  const buyMarketItem = async (item) => {
    console.log(account);
    console.log(item.seller);
    if (account == item.seller) {
      return;
    }
    await (
      await marketplace.purchaseItem(item.itemId, { value: item.totalPrice })
    ).wait();
    await loadMarketplaceItems();
  };

  useEffect(() => {
    loadMarketplaceItems();
  }, []); // componentDidMount
  const navigate = useNavigate();
  if (loadingNormal && loadingSpecial) {
    return (
      <div className="flex justify-center mt-4">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {items.map(
        ({ totalPrice, itemId, name, image, description, isStandard }) => (
          <div
            key={itemId}
            class="text-gray-950 card w-96 bg-base-100 shadow-xl"
          >
            <figure>
              <img src={image} alt={name} />
            </figure>
            <div class="card-body">
              <h2 class="card-title">{name}</h2>
              <p>{description}</p>
              <div class="card-actions justify-end">
                {isStandard ? (
                  <button
                    onClick={() => buyMarketItem({ itemId, totalPrice })}
                    class="btn btn-primary"
                  >
                    Buy Now
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      console.log(itemId);
                      navigate("/exchanges");
                    }}
                    class="btn btn-primary"
                  >
                    Exchange
                  </button>
                )}

                {isStandard ? (
                  <div className="font-bold justify-end">
                    <span className="btn text-lg">
                      {ethers.utils.formatEther(totalPrice)} ETH
                    </span>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
