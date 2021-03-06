import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Button } from "semantic-ui-react";
import { TextArea } from "semantic-ui-react";
import styles from "./SendAmount.css";
import Header from "../../Header";
import AmountDisplay from "./AmountDisplay";
import buttonStyles from "../../Button.css";
import { ContactIcon, BackArrowIcon } from "../../Icons";
import { PopupModal } from "../../Content/PopupModal";
import BackButton from "../../Content/BackButton";
import { trxToDrops, dropsToFiat } from "../../../utils/currency";
import commonStyles from "../WalletCommon.css";
import TronHttpClient from "tron-http-client";
import { toHexString } from "../../../utils/hex";

const tools = require("tron-http-tools");

class SendAmount extends Component {
  constructor(props) {
    super(props);

    this.state = {
      amount: 0,
      address: "",

      showConfirmModal: false,
      modalConfirmText: "",

      target: "",
      tokenStr: "",

      sendProperties: {},

      showFailureModal: false,
      modalFailureText: "Transaction Failed",

      showSuccessModal: false,
      modalSuccessText: "Success",
      accountAddress: "",

      coldOutputString: "",

      usdAmount: 0,

      assetName: this.props.match.params.token,
      senderAddress: this.props.match.params.account
    };
  }

  async onClickSend() {
    if (this.props.isCold) {
      let client = new TronHttpClient();
      let transaction = await tools.transactions.createUnsignedTransferAssetTransaction(
        {
          recipient: this.state.address.trim(),
          sender: this.state.senderAddress.trim(),
          amount: this.state.amount,
          assetName: this.state.assetName
        },
        await client.getLastBlock()
      );
      let hex = toHexString(transaction.serializeBinary());
      this.setState({
        coldOutputString: hex
      });
    } else {
      let accountId = this.props.match.params.account;
      let account = this.props.wallet.persistent.accounts[accountId];

      this.setState({
        ...this.state,
        sendProperties: {
          privateKey: account.privateKey,
          recipient: this.state.address.trim(),
          amount: this.state.amount
        },
        accountAddress: account.publicKey,
        showConfirmModal: true,
        modalConfirmText: `Send ${this.state.amount} ${
          this.state.tokenStr
        } to ${this.state.address}?`
      });
    }
  }

  onSetAmount(amount) {
    this.setState({
      ...this.state,
      amount: amount,
      usdAmount: dropsToFiat(this.props.currency, parseInt(amount) * 1000000)
    });
  }

  onSetAddress(event) {
    this.setState({
      ...this.state,
      address: event.target.value
    });
  }

  async modalConfirm() {
    let client = new TronHttpClient();
    let response = null;
    if (this.props.match.params.token) {
      response = await client
        .sendToken(
          this.state.sendProperties.privateKey,
          this.state.sendProperties.recipient,
          parseInt(this.state.sendProperties.amount),
          this.props.match.params.token
        )
        .catch(x => null);
    } else {
      response = await client
        .sendTrx(
          this.state.sendProperties.privateKey,
          this.state.sendProperties.recipient,
          parseInt(trxToDrops(this.state.sendProperties.amount))
        )
        .catch(x => null);
    }

    if (response === null) {
      this.setState({
        ...this.state,
        sendProperties: {},
        showConfirmModal: false,
        showFailureModal: true,
        modalFailureText: "Transaction failed"
      });
    } else if (response.result != true) {
      this.setState({
        ...this.state,
        sendProperties: {},
        showConfirmModal: false,
        showFailureModal: true,
        modalFailureText: "Transaction failed: " + response.message
      });
    } else {
      this.setState({
        ...this.state,
        sendProperties: {},
        showConfirmModal: false,
        showSuccessModal: true,
        modalSuccessText: "Transaction Successful!"
      });
    }
  }

  modalDecline() {
    this.setState({
      ...this.state,
      sendProperties: {},
      showConfirmModal: false
    });
  }

  modalFailureClose() {
    this.setState({
      ...this.state,
      showFailureModal: false
    });
  }

  goToAccount() {
    this.props.history.push(
      "/wallets/walletDetails/" + this.props.match.params.account
    );
  }

  modalSuccessClose() {
    this.goToAccount();
    this.setState({
      ...this.state,
      showSuccessModal: false
    });
  }

  modalClose() {
    this.state.showConfirmModal = false;
  }

  onSetSenderAddress(e) {
    this.setState({
      senderAddress: e.target.value
    });
  }

  onSetAssetName(e) {
    this.setState({
      assetName: e.target.value
    });
  }

  renderColdwalletOwnerInput() {
    if (!this.props.isCold) return "";

    return (
      <div className={styles.addressContainer}>
        <ContactIcon />
        <input
          onChange={this.onSetSenderAddress.bind(this)}
          placeholder="Sender Address"
          className={styles.address}
          value={this.props.match.params.account}
        />
      </div>
    );
  }

  renderColdwalletAssetName() {
    if (!this.props.isCold) return "";

    return (
      <div className={styles.addressContainer}>
        <ContactIcon />
        <input
          onChange={this.onSetAssetName.bind(this)}
          placeholder="Token Name"
          className={styles.address}
          value={this.props.match.params.token}
        />
      </div>
    );
  }

  renderColdwalletOutput() {
    if (!this.props.isCold) return "";
    return (
      <TextArea
        placeholder="Output..."
        class={commonStyles.textArea}
        value={this.state.coldOutputString}
      />
    );
  }

  render() {
    let token = this.props.match.params.token
      ? this.props.match.params.token
      : "TRX";
    this.state.tokenStr = token;
    return (
      <div className={styles.container}>
        <Header className={styles.white} headerName="Enter Amount" />

        <BackButton />
        <div className={styles.subContainer}>
          {this.renderColdwalletOwnerInput()}
          <div className={styles.addressContainer}>
            <ContactIcon />
            <input
              onChange={this.onSetAddress.bind(this)}
              placeholder="Recipient Address"
              className={styles.address}
              value={this.props.address}
            />
          </div>
          {this.renderColdwalletAssetName()}
          <AmountDisplay
            usd={this.props.isCold ? 0 : this.state.usdAmount}
            token={this.props.isCold ? "" : token}
            onSetAmount={this.onSetAmount.bind(this)}
          />
          <Button
            onClick={this.onClickSend.bind(this)}
            className={`${buttonStyles.button} ${buttonStyles.black}`}
          >
            {this.props.isCold ? "Create" : "Send"}
          </Button>
          {this.renderColdwalletOutput()}

          <PopupModal
            confirmation
            modalVis={this.state.showConfirmModal}
            modalText={this.state.modalConfirmText}
            closeModalFunction={this.modalClose.bind(this)}
            modalConfirm={this.modalConfirm.bind(this)}
            modalDecline={this.modalDecline.bind(this)}
          />

          <PopupModal
            failure
            modalVis={this.state.showFailureModal}
            modalText={this.state.modalFailureText}
            closeModalFunction={this.modalFailureClose.bind(this)}
            modalConfirm={this.modalFailureClose.bind(this)}
          />

          <PopupModal
            success
            modalVis={this.state.showSuccessModal}
            modalText={this.state.modalSuccessText}
            closeModalFunction={this.modalSuccessClose.bind(this)}
            modalConfirm={this.modalSuccessClose.bind(this)}
          />
        </div>
      </div>
    );
  }
}

export default withRouter(
  connect(state => ({ wallet: state.wallet, currency: state.currency }))(
    SendAmount
  )
);
