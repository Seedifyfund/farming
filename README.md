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

- `_rewardAmount`: Amount of rewards to be earned within this period.
- `_start`: Seconds at which the period starts - in UNIX timestamp.
- `_end`: Seconds at which the period ends - in UNIX timestamp.
- `_lockDuration`: Duration in hours to wait before being able to withdraw.

### Farming

For easier testing purposes `tokenAddress` and `rewardTokenAddress` is the same addres. This will avoid opening a new pool on testnet and any user can mint any amount of tokens.

- BSC: https://testnet.bscscan.com/address/0xe9f459266ac5f254d287fa7e9f6803749995e668#code

- Sepolia: https://sepolia.etherscan.io/address/0x53861a3EBD584Dc4A626F6284613546e1cA569aB#code

- ARB Goerli: https://goerli.arbiscan.io/address/0x31b77485BD9fB21f4Cbd96D5Cd318f4019C032a9#code

- Arbitrum mainnet test: https://arbiscan.io/address/0xe6C387ad3C4850b459eF1a7eb5D1FbC446371721#code

  - `resetAndSetStratEndBlock`:
    - rewardAmount: `100_000 ether``
    - startIn: `60`s after tx is mined - **Rolled back to UNIX timestamp starting date**
    - endIn: `2_592_000` --> 30 days (3600 x 24 x 30) after tx is mined - **Rolled back to UNIX timestamp ending date**
    - lockDuration: `1` hour exactly

- Ethereum mainnet test: https://etherscan.io/address/0x0c8da012FdcBB0c9d08531eA7Cc7330DA55e7f99#code
  - rewardAmount: `1_000 ether`
  - start: `1696499272` - Oct 05 2023 09:47:52 GMT
  - end: `1699173686` - Nov 05 2023 08:41:26 GMT
  - lockDuration: `1` hour exactly

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
