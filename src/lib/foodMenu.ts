export const categories = ["Snacks", "Drinks", "Desserts"] as const;
export type Category = (typeof categories)[number];

export type MenuItem = {
  name: string;
  category: Category;
  description: string;
  image: string;
  tag?: string;
};

export const menuItems: MenuItem[] = [
  { name: "Popcorn", category: "Snacks", description: "The cinema classic. Made for every scene.", image: "/food/popcorn.jpg", tag: "Crowd favourite" },
  { name: "Caramel popcorn", category: "Snacks", description: "A sweet, crunchy twist on movie night.", image: "/food/caramel-popcorn.jpg" },
  { name: "Veg puff", category: "Snacks", description: "Flaky pastry with a savoury veg filling.", image: "/food/puff.jpg" },
  { name: "Egg puff", category: "Snacks", description: "A warm and flaky interval snack.", image: "/food/puff.jpg" },
  { name: "Chicken puff", category: "Snacks", description: "Flaky pastry with a chicken filling.", image: "/food/puff.jpg" },
  { name: "Veg sandwich", category: "Snacks", description: "A light bite for the big screen.", image: "/food/sandwich.jpg" },
  { name: "Grilled Mexican veg sandwich", category: "Snacks", description: "A grilled bite with a little kick.", image: "/food/sandwich.jpg" },
  { name: "Chicken sandwich", category: "Snacks", description: "A hearty movie-time sandwich.", image: "/food/sandwich.jpg" },
  { name: "Grilled chicken tikka sandwich", category: "Snacks", description: "A warm, spiced grilled sandwich.", image: "/food/sandwich.jpg" },
  { name: "Nachos with salsa", category: "Snacks", description: "Crunchy nachos with a tangy dip.", image: "/food/nachos.jpg", tag: "Great to share" },
  { name: "French fries", category: "Snacks", description: "Golden, crispy and easy to share.", image: "/food/fries.jpg" },
  { name: "Chicken Nuggets", category: "Snacks", description: "Crispy bites for the whole show.", image: "/food/nuggets.jpg" },
  { name: "Veg burger", category: "Snacks", description: "A satisfying bite between scenes.", image: "/food/veg-burger.jpg" },
  { name: "Chicken Burger", category: "Snacks", description: "A hearty favourite for movie night.", image: "/food/chicken-burger.jpg" },
  { name: "Hot coffee", category: "Drinks", description: "A warming sip for your screening.", image: "/food/hot-coffee.jpg" },
  { name: "Cold coffee", category: "Drinks", description: "Cool, creamy and movie-ready.", image: "/food/cold-coffee.jpg" },
  { name: "Coke", category: "Drinks", description: "A chilled cola for the big screen.", image: "/food/coke.jpg", tag: "Pairs with popcorn" },
  { name: "Fanta", category: "Drinks", description: "A bright, fizzy orange favourite.", image: "/food/fanta.jpg" },
  { name: "Sprite", category: "Drinks", description: "A crisp lemon-lime refreshment.", image: "/food/sprite.jpg" },
  { name: "Maaza can", category: "Drinks", description: "A fruity refreshment.", image: "/food/mango-juice.jpg" },
  { name: "Bottled water", category: "Drinks", description: "Stay refreshed through the show.", image: "/food/water.jpg" },
  { name: "Blackforest cake", category: "Desserts", description: "A chocolatey finish to the movie.", image: "/food/blackforest-cake.jpg" },
  { name: "Choco Donut", category: "Desserts", description: "Soft, sweet and chocolatey.", image: "/food/choco-donut.jpg" },
  { name: "Brownie with ice cream", category: "Desserts", description: "A warm-and-cold favourite.", image: "/food/brownie-ice-cream.jpg", tag: "Treat yourself" },
  { name: "Ice cream scoop", category: "Desserts", description: "Ask for vanilla, chocolate, strawberry, butterscotch, pista or mango.", image: "/food/ice-cream.jpg" },
];

export const pairings = [
  { title: "Movie night essentials", description: "A timeless snack and a refreshing drink.", items: ["Popcorn", "Coke"], image: "/food/popcorn.jpg" },
  { title: "Crunch & chill", description: "Something crispy with something cool.", items: ["Nachos with salsa", "Cold coffee"], image: "/food/nachos.jpg" },
  { title: "Sweet ending", description: "Finish your film on a delicious note.", items: ["Brownie with ice cream", "Hot coffee"], image: "/food/brownie-ice-cream.jpg" },
];
