// deploy the GnosisSafeL2 first to provide the address as singleton to
// GnosisSafeProxyFactory createProxy function

// perform transactions with the multisig through the proxy factory contractt

const { Wallet } = require("ethers");
const { ethers, config } = require("hardhat");

const deployGnosisSafL2 = async () => {
  const GnosisSafeL2 = await ethers.getContractFactory("GnosisSafeL2");
  const gnosisSafeL2 = await GnosisSafeL2.deploy();

  await gnosisSafeL2.deployed();
  console.log("Deployed Multisig to: ", gnosisSafeL2.address);
  return gnosisSafeL2.address;
};

const deployGnosisSafeProxyFactory = async (singleton) => {
  const GnosisSafeProxyFactory = await ethers.getContractFactory(
    "GnosisSafeProxyFactory"
  );
  const gnosisSafeProxyFactory = await GnosisSafeProxyFactory.deploy();

  await gnosisSafeProxyFactory.deployed();

  console.log(
    "Deployed proxy factory contract to: ",
    gnosisSafeProxyFactory.address
  );

  const { createdProxyContract1, createdProxyContract2 } =
    await createProxyContract(gnosisSafeProxyFactory, singleton);

  await setupMultisig(createdProxyContract1, createdProxyContract2);
  await execTransactionMultiSig(createdProxyContract1);
};

// createProxy contract
const createProxyContract = async (gnosisSafeProxyFactory, singleton) => {
  const createdProxyTx1 = await gnosisSafeProxyFactory.createProxy(
    singleton,
    []
  );
  const receipt1 = await createdProxyTx1.wait();
  const createdProxyContract1 = receipt1.events[0].args[0];
  console.log("createdProxyContract1: ", createdProxyContract1);

  const createdProxyTx2 = await gnosisSafeProxyFactory.createProxy(
    singleton,
    []
  );
  const receipt2 = await createdProxyTx2.wait();
  const createdProxyContract2 = receipt2.events[0].args[0];
  console.log("createdProxyContract2: ", createdProxyContract2);

  return { createdProxyContract1, createdProxyContract2 };
};

// interact with the proxy contract
const setupMultisig = async (createdProxyContract1, createdProxyContract2) => {
  console.log({ createdProxyContract1, createdProxyContract2 });
  const [account1, account2, account3, account4] = await ethers.getSigners();
  const gnosisSafeProxy1 = await ethers.getContractAt(
    "GnosisSafeL2",
    createdProxyContract1,
    account1
  );
  // args for setup
  // list of owners
  // number of verifiers (threshold)
  // address to
  // data bytest
  // address fallbackHandler,
  // address paymentToken,
  //  uint256 payment,
  // address payable paymentReceiver

  const owners = [account1.address, account2.address, account3.address];
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const payment = 0;
  const setupTx = await gnosisSafeProxy1.setup(
    owners,
    2,
    account1.address,
    [],
    zeroAddress,
    zeroAddress,
    payment,
    account4.address
  );
  const receipt = await setupTx.wait();
  const event = receipt.events[0];
  console.log("setup multisig event: ", event);
};

const signTx = async () => {
  const [account1, account2, account3, account4] = await ethers.getSigners();
  const accounts = config.networks.hardhat.accounts; // returns an object of the accunt details
  // accounts {
  //   initialIndex: 0,
  //   count: 20,
  //   path: "m/44'/60'/0'/0",
  //   passphrase: '',
  //   mnemonic: 'test test test test test test test test test test test junk',
  //   accountsBalance: '10000000000000000000000'
  // }
  const signatures = [];
  let i = 0;
  while (i < 2) {
    const index = i;
    const wallet = Wallet.fromMnemonic(
      accounts.mnemonic,
      `${accounts.path}/${index}`
    );

    const txParams = {
      to: account4.address,
      value: ethers.utils.parseEther("1"),
      data: [],
      type: 0,
      gasLimit: 21000,
      gasPrice: ethers.utils.parseUnits("50", "gwei"),
    };

    // // create transaction object
    const signedTx = await wallet.signTransaction(txParams);
    const hash = signedTx.slice(2, signedTx[signedTx.length]);
    signatures.push(hash);
    i++;
  }
  console.log(signatures);
  return signatures;
};

const execTransactionMultiSig = async (createdProxyContract1) => {
  const [account1, account2, account3, account4] = await ethers.getSigners();
  const gnosisSafeProxy1 = await ethers.getContractAt(
    "GnosisSafeL2",
    createdProxyContract1
  );
  const signatures = await signTx();
  console.log("signatures", signatures);
  // address to,
  // uint256 value,
  // bytes calldata data,
  // Enum.Operation operation,
  // uint256 safeTxGas,
  // uint256 baseGas,
  // uint256 gasPrice,
  // address gasToken,
  // address payable refundReceiver,
  // bytes memory signatures
  console.log("executing contract");
  await gnosisSafeProxy1.execTransaction(
    account3.address,
    ethers.utils.parseEther("1"),
    [],
    0,
    21000,
    ethers.utils.parseUnits("50", "gwei"),
    ethers.utils.parseUnits("50", "gwei"),
    "0x0000000000000000000000000000000000000000",
    account1.address,
    [
      "0x4554480000000000000000000000000000000000000000000000000000000000",
      "0x4554480000000000000000000000000000000000000000000000000000000000",
    ]
  );
  console.log("contract executed");
};

const main = async () => {
  const gnosisSafeL2Address = await deployGnosisSafL2();
  await deployGnosisSafeProxyFactory(gnosisSafeL2Address);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// 0x0000000000000000000000000000000000000000
