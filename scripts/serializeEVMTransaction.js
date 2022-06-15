import  { TelosEvmApi } from "@telosnetwork/telosevm-js";
import fetch from "node-fetch";
import  Transaction from '@ethereumjs/tx'
import  {BigNumber, ethers}  from  'ethers';

// PARTIAL ABI W/ THE HELLO WORLD METHOD WE WANT TO CALL
const contractAbi = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            }
        ],
        "name": "helloWorld",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

const nativeAccount = "mynativeaccount";
const contractAddress = "0x20027f1e6f597c9e2049ddd5ffb0040aa47f6135";
const parameter = "MY GREAT NAME";

const provider = ethers.getDefaultProvider();
const contract = new ethers.Contract(contractAddress, contractAbi, provider);
const evmApi = new TelosEvmApi({
    endpoint: "https://testnet.telos.net",
    chainId: '41',
    ethPrivateKeys: [],
    fetch: fetch,
    telosContract: 'eosio.evm',
    telosPrivateKeys: []
});
(async () => {

    try {
        const evmAccount = await evmApi.telos.getEthAccountByTelosAccount(nativeAccount);
    } catch(e) {
        console.log(e.message);
        return;
    }
    var linkedAddress = evmAccount.address;
    try {
        const nonce = parseInt(await evmApi.telos.getNonce(linkedAddress), 16);
    } catch(e) {
        console.log(e.message);
        return;
    }
    const feeData = await provider.getFeeData()
    const gasPrice = BigNumber.from(`0x${await evmApi.telos.getGasPrice()}`)

    // POPULATE TRANSACTION
    try {
        var unsignedTrx =  await contract.populateTransaction.helloWorld(parameter);
    } catch(e) {
        console.log(e.message);
        return;
    }
    unsignedTrx.nonce = nonce;
    unsignedTrx.gasLimit = BigNumber.from(`0xA0F4`);
    unsignedTrx.gasPrice = gasPrice;

    // SERIALIZE IT
    try {
        var raw = await ethers.utils.serializeTransaction(unsignedTrx);
    } catch(e) {
        console.log(e.message);
        return;
    }
    raw = raw.replace(/^0x/, '');

    // PRINT IT OUT
    console.log("Raw EVM Transaction: ", raw);
    console.log("EVM Sender: ", linkedAddress.replace(/^0x/, ''));
    console.log("Cleos Command: ",  'cleos --url https://testnet.telos.caleos.io/ push action eosio.evm raw \'{"ram_payer": '+nativeAccount+', "tx": "'+ raw +'" , "estimate_gas": false, "sender": "'+ linkedAddress.replace(/^0x/, '') +'"}\' -p ' + nativeAccount);

})()
