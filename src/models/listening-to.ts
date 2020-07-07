export class ListeningTo {
  id: string = '';
  segmentId: string = '';
  channelId: string = '';
  uid: string = '';
  listening: boolean = false;

  public constructor(init?: Partial<ListeningTo>) {
    Object.assign(this, init);
  }

  static fromSnapshot(id: string, value: any): ListeningTo {
    const listeningTo = new ListeningTo(value);
    listeningTo.id = id;
    return listeningTo;
  }

  toJson(): any{
    return {
      ...this
    }
  }

  public toString = (): string => {
    return `ListeningTo (channelId: ${this.channelId}, uid: ${this.uid}, listening: ${this.listening})`;
  };
}
