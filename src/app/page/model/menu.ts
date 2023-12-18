export type WishMenu = Readonly<{
  id: number
  name: string,
  recommendation: string,
  numberOfVotes: number,
  createdBy: string,
}>

export type WishMenuList = ReadonlyArray<WishMenu>