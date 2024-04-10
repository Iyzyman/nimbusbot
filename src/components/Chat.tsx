// src/components/Chat.tsx
import React, { useEffect, useState } from "react";
import { TextField, Button, Container, Grid, LinearProgress, CircularProgress } from "@mui/material";
import Message from "./Message";
import File from "./File";
import OpenAI from "openai";
import { MessageDto } from "../models/MessageDto";
import SendIcon from "@mui/icons-material/Send";


const Chat: React.FC = () => {
  const [isWaiting, setIsWaiting] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<MessageDto>>(new Array<MessageDto>());
  const [input, setInput] = useState<string>("");
  const [assistant, setAssistant] = useState<any>(null);
  const [thread, setThread] = useState<any>(null);
  const [openai, setOpenai] = useState<any>(null);

  useEffect(() => {
    initChatBot();
  }, []);

  useEffect(() => {
    setMessages([
      {
        content: "Hi, I'm Nimbus, your cloud infrastructure chatbot.\n\
        I'm great at helping developers provision the neccessary infrastrucutre to host their applications.\n \
        I'm here to help take away the trouble of creating infrastructure so that developers are able to focus on what they do best - Developing!\n\
        How can I help you today?",
        isUser: false,
      },
    ]);
  }, [assistant]);

  const initChatBot = async () => {
    const openai = new OpenAI({
      apiKey: process.env.REACT_APP_API_KEY,
      dangerouslyAllowBrowser: true,
    });
    const prompt="You are Nimbus, an assistant great at understanding cloud infrastructure needs and generating Terraform code.\
    Always follow these ten criterias:\
    1. Your main role is to help users provision infrastructure in a easy to follow process, your users may or may not be knowledgable about cloud infrastrucuture.\
    2. Your scope is limited to virtual machines, loadbalancers and security groups.\
    3. Help users by asking simple questions to gather the user's requirements and then generate the Terraform code based on the user's needs.  \
    4. The questions shouldn't be explicitly asking the users for the configurations, ask questions to understand the user's purpose \
    and their goals and then help them decide on the best configurations.\
    5. Continue the conversation until you have enough information to generate the terraform code.\
    6. For every request your basic checklist is: what and how many virtual machines are required, is there a need for a loadbalancer and if so,\
     what type and what are the networking rules and security groups required.\
    7. Always ask if port 22 needs to be exposed for access the machine through SSH if not mentioned by the user.\
    8. Always ask for Yes/No confirmation after showing a description what will be created no need to show code as user may not understand.\
    9. Always produce a downloadable terraform file as the final product using code intepreter tool.\
    10. If the user's request is out of your scope, reply with 'Sorry, I can't help you with that'.\
    Example scenario:\
    User: Hi Nimbus, I would like to host my personal project on a server, it is a simple social media application running on react.\
    System: That sounds like a great project! To get started, I'll need to ask you a few questions to better understand your requirements: \
    1. How many users are you expecting a month? 2. What are the ports required to be accessible from the internet\
    User: Just for a small group of users, I think I just need port 3000 for my react app.\
    System: Based on your description, it sounds like a single virtual machine should be sufficient for hosting your social media application. \
    As for security group configuration I will create a security group to expose port 3000 to all traffic, \
    would you require port 22 to be exposed as well for you to access the machine through ssh? \
    User: Yes, sure\
    System: Understood. Since you only need one virtual machine for now without a load balancer,\
    I will generate the Terraform code for provisioning a single server to host your social media application.Before proceeding,\
    let me confirm the setup with you: I will create:- 1 virtual machine to host your social media application \
    - security groups to expose port 3000 as well as port 22.Would you like me to go ahead with this setup?\
    User: Yes"

    // Create an assistant
    const assistant = await openai.beta.assistants.create({
      name: "Nimbus",
      instructions: prompt,
      tools: [{ type: "code_interpreter" }],
      model: "gpt-3.5-turbo",
    });

    // Create a thread
    const thread = await openai.beta.threads.create();

    setOpenai(openai);
    setAssistant(assistant);
    setThread(thread);
  };

  const createNewMessage = (content: string, isUser: boolean, fileId?:string) => {
    const newMessage = new MessageDto(isUser, content,fileId);
    return newMessage;
  };

  const handleSendMessage = async () => {
    messages.push(createNewMessage(input, true));
    setMessages([...messages]);
    setInput("");

    // Send a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: input,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });
    

    // Create a response
    let response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let completedCount = 0;
    setIsWaiting(true);
    // Wait for the response to be ready
    while (completedCount < 2) {
      if (response.status === "completed") {
        completedCount += 1;
        console.log(`Completed count: ${completedCount}`);
      } else {
        completedCount = 0;
        console.log(`Status: ${response.status}. Waiting for completion...`);
      }
    
      if (completedCount < 2) {
        // Wait for 5 seconds before checking the status again
        
        await new Promise((resolve) => setTimeout(resolve, 2500));
        response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      }
    }
    

    setIsWaiting(false);
    
    // Get the messages for the thread
    const messageList = await openai.beta.threads.messages.list(thread.id);
    console.log(messageList)
    // Find the last message for the current run
    const lastMessageslist = messageList.data
      .filter((message: any) => message.run_id === run.id && message.role === "assistant")

    function removeDownloadLines(message) {
      return message
        .split('\n') // Split the message into an array of lines
        .filter(line => !line.trim().startsWith('[Download')) // Remove lines that start with "[Download"
        .join('\n'); // Join the remaining lines back into a single string
    }
    
    let finalMessage =[]
    let fileId = null;
    for( const lastMessages of lastMessageslist){
      if (lastMessages.file_ids.length>0) {
        fileId = lastMessages.file_ids[0];
        }
        console.log("File ID:", fileId);
        if (lastMessages) {
          console.log(lastMessages)
          finalMessage.push(lastMessages.content[0]['text'].value)
        }
        
    }
    
    if (finalMessage.length>0) {
      let cleanedMessage=finalMessage.reverse().join("\n")
      if (fileId){
        cleanedMessage=removeDownloadLines(cleanedMessage)
      }
      setMessages([...messages, createNewMessage(cleanedMessage, false,fileId)]);
    }
    
    
  };
  
  // detect enter key and send message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Container>
      <Grid container direction="column" spacing={2} paddingBottom={2}>
        {messages.map((message, index) => (
          <Grid item alignSelf={message.isUser ? "flex-end" : "flex-start"} key={index}>
            <Message key={index} message={message} />
            {message.fileId && <File fileId={message.fileId} openai={openai}/>}
          </Grid>
        ))}
      </Grid>
      <Grid container direction="row" paddingBottom={5} justifyContent={"space-between"}>
        <Grid item sm={11} xs={9}>
          <TextField
            label="Type your message"
            variant="outlined"
            disabled={isWaiting}
            fullWidth
            value={input}
            style={{ height: '56px' }}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          {isWaiting && <LinearProgress color="inherit" />}
        </Grid>
        <Grid item sm={1} xs={3}>
          <Button variant="contained" size="large" color="primary" onClick={handleSendMessage} disabled={isWaiting}
            style={{ height: '56px' }}>
            {isWaiting && <CircularProgress color="inherit" />}
            {!isWaiting && <SendIcon fontSize="large" />}
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Chat;
