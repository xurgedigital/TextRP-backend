1. Twilio API
 1.1 POST        /user/twilio/create_conversation 
    This API accepts { conversationName } in the body and returns { conversationParticipant,conversation }.
    This will create a conversation in the Twilio and add the current loggedin user into that conversation.
    The conversation in the response has the name and the id that will be used in furthur APIs.
    In case of errors:
        a. 'Unauthorized Access!': The current user needs authentication.
        b. 'Please provide a name to your conversation!': conversationName was not provided in the body.
        c. 'An error occoured from twilio while creating user!': This error occours when something went wrong from twilio's end.
        d. 'An error occoured from twilio while creating conversation!': This error occours when something went wrong from twilio's end.

 1.2 POST        /user/twilio/start_conversation/:conversation
    This API will accept { conversation } in the params which is conversationID and { walletAddress } in the body which indicated the reciever walletaddress.
    It will create a participant of the reciever user and add it to the twilio conversation.
    In case of errors:
        a. 'Please provide conversation in params!': Provide conversationID in the params
        b. 'Conversation Not found!': The conversationID provided dosent exits in the database.
        c. 'Reciver wallet address not found!': The wallet address needs to be provided in the body 
        d. 'Reciver not found!': The wallet address provided in the body dosent belong to any reciever
        e. 'An error occoured from twilio while creating user!': This error occours when something went wrong from twilio's end.
        f. 'An error occoured from twilio while adding participant to conversation!': This error occours when something went wrong from twilio's end.

 1.3 POST        /user/twilio/send_message/:conversation
    This API accepts { conversation } in the params as conversationID and { message } in the body.
    In case of errors:
        a. 'Unauthorized Access!': The current user needs authentication.
        b. 'Please provide conversation in params!': Provide conversationID in the params
        c. 'Conversation Not found!': The conversationID provided dosent exits in the database.
        d. 'Please send a message in the body!': The message needs to be provided in the body 
        e. 'An error occoured from twilio while creating messages!': This error occours when something went wrong from twilio's end.

 1.4 GET|HEAD    /user/twilio/get_all_messages/:conversation
    This API accepts { conversation } in the params as conversationID and provides all messages from that conversation.
     In case of errors:
        a. 'Please provide conversation in params!': Provide conversationID in the params
        b. 'Conversation Not found!': The conversationID provided dosent exits in the database.
        c. 'An error occoured from twilio while fetching messages!': This error occours when something went wrong from twilio's end.

 1.5 GET|HEAD    /user/twilio/mark_message_as_read/:message
    This API marks a message as read. It takes { message } as messageID in the params and user from authUser(current logged in user).
     In case of errors:
        a. 'Unauthorized Access!': The current user needs authentication.
        b. 'Please provide messageId in params!': Provide messageId in the params
        c. 'User Message Not found!': The messageId provided has no matching data.
        d. 'User has already read the message!': If user has already read it.
        e. 'Something went wrong': If something went wrong with the server

2. Socket
   Events:
      a. joinConversation: 
         Emit event to this and send conversationId ex: socket.emit('joinConversation',3). Here 3 is sent as the conversationId. 
         The socket user will join the channel/room name conversation.platformId (ex: CHc801c52673f342c9afb15cd52106e990) provided by twilio.
      b. joinedChannel: 
         Listen to this event, once joinConversation is executed succesfuly, you will recieve a conversation instance on this event.
         Example response:
         socket.on('joinedChannel',payload)
         payload = {
               "id": 4,
               "identifier_id": "4",
               "creator_id": "3",
               "platform_converstion_id": "CHe7f14cff6c544a99bc1816780c50bf18",
               "created_at": "2023-03-28T20:26:04.771+05:30",
               "updated_at": "2023-03-28T20:26:04.771+05:30",
               "name": "Crediaat 2"
            }
      c. messageNotification:
         Socket rooms/channels are created on conversation.platformId (ex: CHc801c52673f342c9afb15cd52106e990). 
         When the user has joined the channel,
         messageNotification is an event that is emitted in the channel when user sends message in the channel.
         
      d. error:
         Listen to this event for any errors that will be emitted during the execution of any socket event.

   To listen to new messages:
      Emit joinConversation conversationId
      Listen joinedChannel
      Listen messageNotification
      Send message in the channel
      