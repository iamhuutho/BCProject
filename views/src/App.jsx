import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { ethers } from "ethers";
import MarketplaceAddress from "../../contracstData/Marketplace-address.json";
import MarketplaceABI from "../../contracstData/Marketplace.json";
import StandardNFTAddress from "../../contracstData/standardNFT-address.json";
import StandardNFTABI from "../../contracstData/StandardNFT.json";
import SpecialNFTAddress from "../../contracstData/specialNFT-address.json";
import SpecialNFTABI from "../../contracstData/SpecialNFT.json";
import Navbar from "./Navbar";
import Home from "./Home";
import Create from "./Create";
import MyListedItems from "./MyListedItems";
import MyPurchases from "./MyPurchases";
import Exchange from "./Exchange";
function App() {
  const [account, setAccount] = useState(null);
  const [marketplace, setMarketplace] = useState({});
  const [standardToken, setStandardToken] = useState({});
  const [specialToken, setSpecialToken] = useState({});
  const [loading, setLoading] = useState(true);

  // Metamask Login/Connect
  const web3Handler = async () => {
    setLoading(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);

      // Get provider from Metamask
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Set signer
      const signer = provider.getSigner();

      window.ethereum.on("chainChanged", (chainId) => {
        window.location.reload();
      });

      window.ethereum.on("accountsChanged", async function (accounts) {
        setAccount(accounts[0]);
        await web3Handler();
      });

      await loadContracts(signer);
    } catch (error) {
      console.error("Error connecting to Metamask:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async (signer) => {
    const marketplace = new ethers.Contract(
      MarketplaceAddress.address,
      MarketplaceABI.abi,
      signer
    );
    setMarketplace(marketplace);
    const standardToken = new ethers.Contract(
      StandardNFTAddress.address,
      StandardNFTABI.abi,
      signer
    );
    setStandardToken(standardToken);
    const specialToken = new ethers.Contract(
      SpecialNFTAddress.address,
      SpecialNFTABI.abi,
      signer
    );
    setSpecialToken(specialToken);
  };

  return (
    <BrowserRouter>
      <Navbar account={account} web3Handler={web3Handler} />

      {loading ? (
        <div className="flex flex-col items-center mt-4">
          <span className="loading loading-ring loading-lg"></span>
          <p>Awaiting Metamask Connection...</p>
        </div>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <Home
                account={account}
                marketplace={marketplace}
                standardToken={standardToken}
                specialToken={specialToken}
              />
            }
          />
          <Route
            path="/create"
            element={
              <Create
                marketplace={marketplace}
                standardToken={standardToken}
                specialToken={specialToken}
              />
            }
          />
          <Route
            path="/my-listed-items"
            element={
              <MyListedItems
                marketplace={marketplace}
                standardToken={standardToken}
                specialToken={specialToken}
                account={account}
              />
            }
          />
          <Route
            path="/my-purchases"
            element={
              <MyPurchases
                marketplace={marketplace}
                standardToken={standardToken}
                specialToken={specialToken}
                account={account}
              />
            }
          />

          <Route
            path="/exchanges"
            element={
              <Exchange
                marketplace={marketplace}
                standardToken={standardToken}
                specialToken={specialToken}
                account={account}
              />
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;
