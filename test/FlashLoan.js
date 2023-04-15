const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('Flashloan', () => {
    let token, flashLoan, flashLoanReceiver;
    let deployer;

    beforeEach(async () => {
        // Setup Accounts
        accounts = await ethers.getSigners()
        deployer = accounts[0]

        // Contracts
        const FlashLoan = await ethers.getContractFactory('FlashLoan')
        const FlashLoanReceiver = await ethers.getContractFactory('FlashLoanReceiver')
        const Token = await ethers.getContractFactory('Token')

        // Deploy token
        token = await Token.deploy('Spencer Coin', 'SPEN', '1000000')

        // Deploy Flash Loan Pool
        flashLoan = await FlashLoan.deploy(token.address)

        // Approve tokens before deposit
        let transaction = await token.connect(deployer).approve(flashLoan.address, tokens(1000000))
        await transaction.wait()

        // Deposit tokens in pool
        transaction = await flashLoan.connect(deployer).depositTokens(tokens(1000000))
        await transaction.wait()

        // Deploy FlashLoanReceiver
        flashLoanReceiver = await FlashLoanReceiver.deploy(flashLoan.address)

    })

    describe('Deployment', () => {

        it('successfully sends tokens to flash loan pool', async () => {
            expect(await token.balanceOf(flashLoan.address)).to.equal(tokens(1000000))
        })
    })

    describe('Borrowing funds', () => {

        it('borrows funds from the pool', async () => {
            let amount = tokens(100)
            let transaction = await flashLoanReceiver.connect(deployer).executeFlashLoan(amount)
            let result = await transaction.wait()

            await expect(transaction).to.emit(flashLoanReceiver, 'LoanReceived').withArgs(token.address, amount)
        })
    })
})