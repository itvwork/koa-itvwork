class Index{
  constructor() {
    return this;
  }
  init(ctx, next) {
      this.ctx = ctx;
      this.next = next;

  }

  async index(){
      this.ctx.body="----------------------------------";
  }

}
module.exports = new Index();