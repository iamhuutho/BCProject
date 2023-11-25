// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {
    // Variables
    address payable public immutable feeAccount; // the account that receives the fee
    uint256 public immutable feePercent; // the fee percentage on sale
    uint256 public itemCount;
    uint256 public normalItemCount;
    uint256 public specialItemCount;

    struct Item {
        uint256 itemId;
        IERC721 nft;
        uint256 tokenId;
        uint256 price;
        address payable seller;
        bool sold;
        string category;
    }

    struct SpecialItem {
        uint256 itemId;
        IERC721 nft;
        uint256 tokenId;
        address payable seller;
        bool exchanged;
        string category;
    }

    // itemID => Item
    mapping(uint256 => Item) public items;
    // itemID => SpecialItem
    mapping(uint256 => SpecialItem) public exchangedItems;

    function setSellerToZero(uint256 itemId) external {
        require(
            items[itemId].seller != address(0),
            "Seller is already set to zero"
        );
        items[itemId].seller = payable(address(0));
    }

    event Offered(
        uint256 itemId,
        address indexed nft,
        uint256 tokenId,
        uint256 price,
        address indexed seller
    );

    event Bought(
        uint256 itemId,
        address indexed nft,
        uint256 tokenId,
        uint256 price,
        address indexed seller,
        address indexed buyer
    );

    event Exchanged(
        uint256 exchangedItemId,
        address indexed exchangedNft,
        uint256 tokenId,
        uint256[] itemList,
        address indexed owner
    );

    constructor(uint256 _feePercent) {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    function makeItem(
        IERC721 _nft,
        uint256 _tokenId,
        uint256 _price,
        string memory _category
    ) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        itemCount++;
        normalItemCount++;
        _nft.transferFrom(msg.sender, address(this), _tokenId);

        items[normalItemCount] = Item(
            normalItemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false,
            _category
        );
        // emit Offered event
        emit Offered(
            normalItemCount,
            address(_nft),
            _tokenId,
            _price,
            msg.sender
        );
    }

    function makeSpecialItem(
        IERC721 _nft,
        uint256 _tokenId,
        uint256 _price,
        string memory _category
    ) external nonReentrant {
        specialItemCount++;
        itemCount++;
        _nft.transferFrom(msg.sender, address(this), _tokenId);

        exchangedItems[specialItemCount] = SpecialItem(
            specialItemCount,
            _nft,
            _tokenId,
            payable(msg.sender),
            false,
            _category
        );
    }

    function exchangeItem(
        uint256[] memory _itemlist,
        uint256 _exchangedItemId
    ) external nonReentrant {
        require(
            _exchangedItemId > 0 && _exchangedItemId <= specialItemCount,
            "Special item doesn't exist"
        );
        SpecialItem storage specialItem = exchangedItems[_exchangedItemId];
        require(!specialItem.exchanged, "Special item already exchanged");

        for (uint i = 0; i < _itemlist.length; i++) {
            require(
                _itemlist[i] > 0 && _itemlist[i] <= normalItemCount,
                "Normal item doesn't exist"
            );
            require(!items[_itemlist[i]].sold, "Normal item already sold");

            // Transfer normal NFT to the buyer
            items[_itemlist[i]].nft.transferFrom(
                address(this),
                msg.sender,
                items[_itemlist[i]].tokenId
            );

            // Update normal item to sold
            items[_itemlist[i]].sold = true;
        }

        // Transfer special NFT to the buyer
        specialItem.nft.transferFrom(
            address(this),
            msg.sender,
            specialItem.tokenId
        );

        // Update special item to exchanged
        specialItem.exchanged = true;

        // Emit Exchanged event
        emit Exchanged(
            _exchangedItemId,
            address(specialItem.nft),
            specialItem.tokenId,
            _itemlist,
            msg.sender
        );
    }

    function purchaseItem(uint256 _itemId) external payable nonReentrant {
        require(_itemId > 0 && _itemId <= itemCount, "Item doesn't exist");
        Item storage item = items[_itemId];
        require(!item.sold, "Item already sold");

        uint256 _totalPrice = getTotalPrice(item.price);
        require(
            msg.value >= _totalPrice,
            "Not enough ether to cover item price and market fee"
        );

        // Pay seller and feeAccount
        item.seller.transfer(item.price);
        feeAccount.transfer(_totalPrice - item.price);

        // Update item to sold
        item.sold = true;

        // Transfer NFT to the buyer
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);

        // Emit Bought event
        emit Bought(
            _itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            msg.sender
        );
    }

    function getTotalPrice(uint256 _price) public view returns (uint256) {
        return (_price * (100 + feePercent)) / 100;
    }
}
