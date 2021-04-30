import React from "react";
import { Bubble, GiftedChat, InputToolbar } from "react-native-gifted-chat";

import {
  View,
  Text,
  Button,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

const firebase = require("firebase");
require("firebase/firestore");

export default class Chat extends React.Component {
  constructor() {
    super();
    this.state = {
      messages: [],
    };

    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyCgCv_TqrMSCJzwbpS1Qfm8QoG2jWbqb3w",
        authDomain: "chat-app-66fd9.firebaseapp.com",
        projectId: "chat-app-66fd9",
        storageBucket: "chat-app-66fd9.appspot.com",
        messagingSenderId: "610421316601",
        appId: "1:610421316601:web:e56d1830100b46b867bb28",
        measurementId: "G-EX0FPG5J84",
      });
    }

    this.referenceChatMessages = firebase.firestore().collection("messages");
  }

  componentDidMount() {
    // let userJoinedMessage = `User ${this.props.route.params.name} has joined the chat.`;
    // Check user connection
    NetInfo.fetch().then((connection) => {
      if (connection.isConnected) {
        this.setState({
          isConnected: true,
        });

        // Reference to load messages via Firebase
        this.referenceChatMessages = firebase
          .firestore()
          .collection("messages");

        // Authenticates user via Firebase
        this.authUnsubscribe = firebase
          .auth()
          .onAuthStateChanged(async (user) => {
            if (!user) {
              await firebase.auth().signInAnonymously();
            }

            this.setState({
              uid: user.uid,
              messages: [],
            });

            this.unsubscribe = this.referenceChatMessages
              .orderBy("createdAt", "desc")
              .onSnapshot(this.onCollectionUpdate);
          });
        console.log("online");
      } else {
        this.setState({
          isConnected: false,
        });
        this.getMessage();
        Alert.alert("No internet connection, unable to send messages");
        console.log("offline");
      }
    });
  }

  renderInputToolbar(props) {
    if (this.state.isConnected == false) {
    } else {
      return <InputToolbar {...props} />;
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
    this.authUnsubscribe();
  }

  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // go through each document
    querySnapshot.forEach((doc) => {
      // get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: data.user,
      });
    });

    this.setState({
      messages,
    });
  };

  // Retrieve messages from client-side storage
  async getMessage() {
    let messages = "";
    try {
      messages = (await AsyncStorage.getItem("messages")) || [];
      this.setState({
        messages: JSON.parse(messages),
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  // Saves messages in client-side storage
  async saveMessage() {
    try {
      await AsyncStorage.setItem(
        "messages",
        JSON.stringify(this.state.messages)
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  // Delete messages in client-side storage
  async deleteMessage() {
    try {
      await AsyncStorage.removeItem("messages");
      this.setState({
        messages: [],
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  // Adds messages to cloud storage
  addMessage() {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      _id: message._id,
      text: message.text,
      createdAt: message.createdAt,
      user: message.user,
    });
  }

  onSend(messages = []) {
    this.setState(
      (previousState) => ({
        messages: GiftedChat.append(previousState.messages, messages),
      }),
      () => {
        this.addMessage();
        this.saveMessage();
      }
    );
  }

  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "#000",
          },
        }}
      />
    );
  }

  render() {
    // let name = this.props.route.params.name;
    // this.props.navigation.setOptions({ title: name });
    return (
      <View style={{ flex: 1 }}>
        <GiftedChat
          renderBubble={this.renderBubble.bind(this)}
          isConnected={this.state.isConnected}
          placeholder={
            this.state.isConnected
              ? "Type a message..."
              : "No internet connection"
          }
          maxInputLength={this.state.isConnected ? 1000 : 0}
          renderInputToolbar={this.renderInputToolbar.bind(this)}
          messages={this.state.messages}
          onSend={(messages) => this.onSend(messages)}
          user={this.state.user}
        />
        {Platform.OS === "android" ? (
          <KeyboardAvoidingView behavior="height" />
        ) : null}
      </View>
    );
  }
}
