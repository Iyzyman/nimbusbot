export class MessageDto {
  isUser: boolean;
  content: string;
  fileId?: string;

  constructor(isUser: boolean, content: string,fileId?:string) {
    this.isUser = isUser;
    this.content = content;
    this.fileId = fileId
  }
}
