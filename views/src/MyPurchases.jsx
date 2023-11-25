import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function MyPurchases({
  marketplace,
  standardToken,
  specialToken,
  account,
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const loadMarketplaceItems = async () => {
    const filter = marketplace.filters.Bought(
      null,
      null,
      null,
      null,
      null,
      account
    );
    let itemsFilter = await marketplace.queryFilter(filter);
    for (let i = 0; i < itemsFilter.length; i++) {
      const item = itemsFilter[i].args;
      // get uri url from nft contract
      const uri = await standardToken.tokenURI(item.tokenId);
      // use uri to fetch the nft metadata stored on ipfs
      const response = await fetch(uri);
      const metadata = await response.json();

      // get total price of item (item price + fee)
      const totalPrice = await marketplace.getTotalPrice(item.itemId);
      // add item to items array

      items.push({
        totalPrice,
        itemId: item.itemId,
        seller: item.seller,
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
      });
    }
    setLoading(false);
    setItems(items);
  };

  useEffect(() => {
    loadMarketplaceItems();
  }, []); // componentDidMount

  if (loading) {
    return (
      <div className="flex justify-center mt-4">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {items.map(
        ({ totalPrice, itemId, name, image, description, category }) => (
          <div
            key={itemId}
            className="text-gray-950 border-red-1000 card w-96 bg-base-100 shadow-xl"
          >
            <figure>
              <img src={image} alt={name} />
            </figure>
            <div className="card-body">
              <h2 className="card-title">
                {name}
                <div className="badge badge-secondary">NEW</div>
              </h2>
              <p>{description}</p>
              <div className="card-actions justify-end">
                <div className="badge badge-outline">{category}</div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
