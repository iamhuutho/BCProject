import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function MyListedItems({
  marketplace,
  standardToken,
  specialToken,
  account,
}) {
  const [loadingNormal, setLoadingNormal] = useState(true);
  const [loadingSpecial, setLoadingSpecial] = useState(true);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showExchangeButton, setShowExchangeButton] = useState(false);
  const handleCheckboxChange = (itemId) => {
    const index = selectedItems.indexOf(itemId);
    if (index === -1) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      const newSelectedItems = [...selectedItems];
      newSelectedItems.splice(index, 1);
      setSelectedItems(newSelectedItems);
    }
  };

  const loadMarketplaceItems = async () => {
    const totalitemCount = await marketplace.itemCount();
    const specialitemCount = await marketplace.specialItemCount();
    const normalitemCount = totalitemCount - specialitemCount;
    let items = [];
    const filter = marketplace.filters.Bought(
      null,
      null,
      null,
      null,
      null,
      account
    );
    let itemsFilter = await marketplace.queryFilter(filter);
    for (let i = 1; i <= itemsFilter.length; i++) {
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
    for (let i = 1; i <= normalitemCount; i++) {
      const item = await marketplace.items(i);
      if (!item.sold && account.toLowerCase() === item.seller.toLowerCase()) {
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
          category: metadata.category,
          isStandard: true,
        });
      }
    }
    console.log("Special Count" + specialitemCount);
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
          itemId: item.itemId,
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

  useEffect(() => {
    loadMarketplaceItems();
  }, []); // componentDidMount

  if (loadingNormal && loadingSpecial) {
    return (
      <div className="flex justify-center mt-4">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      {items.map(
        ({
          totalPrice,
          itemId,
          name,
          image,
          description,
          category,
          isStandard,
        }) => (
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
                {isStandard ? (
                  <div className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                    Standard
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-md bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-inset ring-pink-700/10">
                    Special
                  </div>
                )}
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
