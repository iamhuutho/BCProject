import React, { useState } from "react";
import { create as createIpfsClient } from "ipfs-http-client";
import { ethers } from "ethers";
const client = createIpfsClient({
  host: "localhost",
  port: 5001,
  protocol: "http",
});
export default function Create({ marketplace, standardToken, specialToken }) {
  const [image, setImage] = useState("");
  const [price, setPrice] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
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

  const createNFT = async () => {
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
        await standardToken.mint(`http://localhost:8080/ipfs/${result.path}`)
      ).wait();
      const id = await standardToken.tokenCounter();
      console.log(id);
      // approve marketplace to spend nft
      await (
        await standardToken.setApprovalForAll(marketplace.address, true)
      ).wait(); // await ().wait() đợi tx success
      await (
        await marketplace.makeItem(
          standardToken.address,
          id,
          listingPrice,
          category
        )
      ).wait();
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <input
        type="file"
        onChange={uploadToIPFS}
        className="text-gray-400 file-input  file-input-bordered w-full max-w-xs"
      />
      <input
        type="text"
        placeholder="Name NFT"
        onChange={(e) => setName(e.target.value)}
        className="text-gray-400 input input-bordered w-full max-w-xs"
      />
      <input
        type="text"
        placeholder="Description"
        onChange={(e) => setDescription(e.target.value)}
        className="text-gray-400 input input-bordered w-full max-w-xs"
      />
      <input
        type="text"
        placeholder="Price"
        onChange={(e) => setPrice(e.target.value)}
        className="text-gray-400 input input-bordered w-full max-w-xs"
      />
      <input
        type="text"
        placeholder="Current Team"
        onChange={(e) => setCategory(e.target.value)}
        className="text-gray-400 input input-bordered w-full max-w-xs"
      />
      <button className="btn" onClick={createNFT}>
        Create & List NFT
      </button>
    </div>
  );
}
