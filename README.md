# Farming Contract

Based on `zok-prelim-report` - audited from this hash `e71fd388f041a46dd18bcfdf34be6ca563c58b79` and deployed on BSC mainnet already.

## TODO

- [x] Deploy on ARB Goerli
- [ ] Once all are tested on testnet, deploy on mainnet

## Testnet

### Reward Configuration

To set farming rewards call:

```solidity
 function resetAndsetStartEndBlock(
        uint256 _rewardAmount,
        uint256 _start,
        uint256 _end,
        uint256 _lockDuration
) external onlyOwner returns (bool)
```

- `_rewardAmount`: amount of reward that will be used from `msg.sender` - rewards saty in `msg.sender` wallet so ensure you have approved farming contract to spend your tokens.
- `_start`: block number when farming starts - changes according to which network you are on.
- `_end`: block number when farming ends - changes according to which network you are on.
- `_lockDuration`: how long the reward will be locked after farming ends - always expressed in hours, which means as solidity does not support decimals the lower you can go is 1h.

### Farming

For easier testing purposes `tokenAddress` and `rewardTokenAddress` is the same addres. This will avoid opening a new pool on testnet and any user can mint any amount of tokens.

- BSC: https://testnet.bscscan.com/address/0xe9f459266ac5f254d287fa7e9f6803749995e668#code

- Sepolia: https://sepolia.etherscan.io/address/0x53861a3EBD584Dc4A626F6284613546e1cA569aB#code

- ARB Goerli: https://goerli.arbiscan.io/address/0x31b77485BD9fB21f4Cbd96D5Cd318f4019C032a9#code

### Test Token

- BSC: https://testnet.bscscan.com/address/0x0a0fDa2921EC382b7D43e8A2Bb3524a941C767bb#code

- Sepolia: https://sepolia.etherscan.io/address/0x394847038eE56af38f3c73b227961a52f0b92b87#code

- ARB Goerli: https://goerli.arbiscan.io/address/0x2B7CCBA0225bA5104973821e52C971C0d5882BaA#code
