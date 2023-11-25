import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { create as createIpfsClient } from "ipfs-http-client";

const client = createIpfsClient({
  host: "localhost",
  port: 5001,
  protocol: "http",
});
export default function Exchange({
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
  const [image, setImage] = useState("");
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
    setLoadingNormal(false);
    setItems(items);
    setLoadingSpecial(false);
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
  const uploadToIPFS = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (file !== "undefined") {
      try {
        const result = await client.add(file);
        setImage(`http://localhost:8080/ipfs/${result.path}`);
        console.log(file);
      } catch (error) {
        console.log("ipfs image upload error: ", error);
      }
    }
  };

  const handleExchangeButtonClick = async () => {
    console.log("Selected Items:", selectedItems.length);
    console.log(selectedItems.length);
    if (selectedItems.length < 2) {
      return;
    } else {
      const name = "Provip Coin";
      const price = 100;
      const description = "Token for the Elite";
      const category = "Special Token";
      if (!image || !price || !name || !description || !category) return;
      try {
        const result = await client.add(
          JSON.stringify({
            image,
            name,
            price,
            description,
            category,
          })
        );

        // add nft to marketplace
        const listingPrice = ethers.utils.parseEther(price.toString()); // FIX : 5.7.3
        await (
          await specialToken.mint(`http://localhost:8080/ipfs/${result.path}`)
        ).wait();
        const id = await specialToken.tokenCounter();
        console.log(id);
        // approve marketplace to spend nft
        await (
          await specialToken.setApprovalForAll(marketplace.address, true)
        ).wait(); // await ().wait() đợi tx success
        await (
          await marketplace.makeSpecialItem(
            specialToken.address,
            id,
            listingPrice,
            category
          )
        ).wait();
      } catch (error) {
        console.log(error);
      }
      // Set seller address to null
      console.log(await marketplace.specialItemCount());
      for (let i = 0; i < selectedItems.length; i++) {
        const id = selectedItems[i];
        await marketplace.setSellerToZero(id);
      }
      console.log(await marketplace.specialItemCount());
    }
  };

  if (loadingNormal && loadingSpecial) {
    return (
      <div className="flex justify-center mt-4">
        <span className="loading loading-dots loading-lg"></span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <div>
        <input
          type="file"
          onChange={uploadToIPFS}
          className="text-gray-400 file-input  file-input-bordered w-full max-w-xs"
        />
      </div>
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
                  <div className="badge badge-secondary">NEW</div>
                </h2>
                <p>{description}</p>
                <div className="card-actions justify-end">
                  <div className="badge badge-outline">{category}</div>
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">{Number(itemId)}</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      onChange={() => handleCheckboxChange(itemId)}
                    />
                  </label>
                </div>
                {selectedItems.length > 0 && (
                  <div className="fixed bottom-4 right-4">
                    <button
                      className="btn btn-primary"
                      onClick={handleExchangeButtonClick}
                    >
                      Exchange
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
