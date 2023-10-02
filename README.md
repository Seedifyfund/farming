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

- Arbitrum mainnet test: https://arbiscan.io/address/0x8b943899f4216092cE2973476b079a5a78a0F3D6#code

  - `resetAndSetStratEndBlock`: lockDuration: `12` (approximately 1h - should have been `11.5384615385`)

- Ethereum mainnet test: https://etherscan.io/address/0x55560FBfF60FB3409d21Dd86dF9eD364bEA39fbf#code
  - `resetAndSetStratEndBlock`: lockDuration: `1` (exactly 3h - can not go lower as decimals not handled)

### Test Token

- BSC: https://testnet.bscscan.com/address/0x0a0fDa2921EC382b7D43e8A2Bb3524a941C767bb#code

- Sepolia: https://sepolia.etherscan.io/address/0x394847038eE56af38f3c73b227961a52f0b92b87#code

- ARB Goerli: https://goerli.arbiscan.io/address/0x2B7CCBA0225bA5104973821e52C971C0d5882BaA#code

- Arb mainnet (testing purposes):

  - MCKT token: https://arbiscan.io/address/0x2B7CCBA0225bA5104973821e52C971C0d5882BaA
  - Liquidity pool:
    - https://arbiscan.io/tx/0xcd9c8410a83f09ea79989658e7a6ef5aa661d426086ce8d80bc38bee392304a8
    - CMLT-LP: https://arbiscan.io/token/0x395e24b1ebfa15d2652193133151cc8987c8d27e

- Ethereum mainnet (testing purposes):
  - MCKT token: https://etherscan.io/address/0x126E4dcd47c00054f367345202de31dB570Fe2a7#code
  - Liquidity pool:
    - https://etherscan.io/tx/0xa4580b67cb2778b5bd93a41adb72393f5c228e8312ff8826c64c679f6e092087
    - UNI-LP: https://etherscan.io/address/0x619391ba76b316fc56bc50388b90d9c8f24fcfe7
