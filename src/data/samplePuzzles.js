const SAMPLE_DATA = [
  // 1) Odd One Out
  {
    meta:{branding:'© 2025 HMQUIZ • hmquiz.example', logo:'/logo.png', id:'p1',title:'Odd One Out – Sample',subtitle:'Find the one that doesn’t match',difficulty:'easy',page_size:'A4'},
    type:'odd_one_out',
    grid:{rows:3,cols:3,items:Array.from({length:9}).map((_,i)=>i===4?{ch:'😎'}:{ch:'😀'})},
    odd_index:4
  },
  // 2) Emoji Quiz
  {
    meta:{branding:'© 2025 HMQUIZ • hmquiz.example', logo:'/logo.png', id:'p2',title:'Emoji Quiz – Sample',subtitle:'Guess the phrase',difficulty:'medium',page_size:'A4'},
    type:'emoji_quiz',
    prompt:{tiles:[{ch:'🎥',alt:'movie'},{ch:'⭐',alt:'star'}],instruction:'Guess the phrase'},
    answer:{text:'Movie Star'}
  },
  // 3) Word Search (auto layout HV)
  {
    meta:{branding:'© 2025 HMQUIZ • hmquiz.example', logo:'/logo.png', id:'p3',title:'Word Search – Fruits',subtitle:'Find all the fruits',difficulty:'medium',page_size:'A4'},
    type:'word_search',
    auto_layout:true,
    grid:{ rows: 12, cols: 12 },
    word_list:['APPLE','BANANA','GRAPE','MANGO','PEAR','LEMON','KIWI','ORANGE'],
    options:{ allowReverse:true, directions:['H','V'], maxAttemptsPerWord:500 }
  },
  // 4) Crossword – mini
  {
    meta:{branding:'© 2025 HMQUIZ • hmquiz.example', logo:'/logo.png', id:'p4',title:'Crossword – Mini',subtitle:'Fill the grid',difficulty:'medium',page_size:'A4'},
    type:'crossword',
    grid:{ rows:6, cols:6, blocks:[[1,3],[3,2],[4,5]] },
    numbers:[
      {row:1,col:1,num:1},{row:1,col:4,num:2},{row:2,col:1,num:3},{row:2,col:3,num:4},{row:3,col:3,num:5},
    ],
    clues:{
      across:[
        {num:1,len:2,clue:'Opposite of no'},
        {num:2,len:3,clue:'H2O'},
        {num:3,len:2,clue:'Sun rises in the __'},
      ],
      down:[
        {num:1,len:3,clue:'Feline'},
        {num:4,len:5,clue:'Color of grass (5)'},
        {num:5,len:4,clue:'A fruit'},
      ],
    },
    answers:{
      filled:[
        {row:1,col:1,ch:'Y'},{row:1,col:2,ch:'E'},
        {row:1,col:4,ch:'W'},{row:1,col:5,ch:'A'},{row:1,col:6,ch:'T'},
        {row:2,col:1,ch:'E'},{row:2,col:2,ch:'A'},
        {row:3,col:3,ch:'P'},{row:3,col:4,ch:'E'},{row:3,col:5,ch:'A'},{row:3,col:6,ch:'R'},
        {row:2,col:3,ch:'G'},{row:3,col:3,ch:'R'},{row:4,col:3,ch:'E'},{row:5,col:3,ch:'E'},{row:6,col:3,ch:'N'},
      ]
    }
  },
  // 5) Sudoku – 9x9 (classic)
  {
    meta:{branding:'© 2025 HMQUIZ • hmquiz.example', logo:'/logo.png', id:'p5',title:'Sudoku – 9×9',subtitle:'Fill 1–9 without repeats',difficulty:'hard',page_size:'A4'},
    type:'sudoku',
    grid:{ size:9, givens:[
      {row:1,col:1,val:5},{row:1,col:2,val:3},{row:1,col:5,val:7},
      {row:2,col:1,val:6},{row:2,col:4,val:1},{row:2,col:5,val:9},{row:2,col:6,val:5},
      {row:3,col:2,val:9},{row:3,col:3,val:8},{row:3,col:8,val:6},
    ]},
    solution:{ rows:[
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9],
    ]},
    options:{ subgrid:{rows:3, cols:3} }
  },
  // 6) Fill in the Blanks
  {
    meta:{branding:'© 2025 HMQUIZ • hmquiz.example', logo:'/logo.png', id:'p6',title:'Fill in the Blanks – Capitals',subtitle:'Write the missing words',difficulty:'easy',page_size:'A4'},
    type:'fill_in_blanks',
    items:[
      { text:'The capital of France is ____.', blanks:[{len:5}], answer:['PARIS'] },
      { text:'The capital of India is ____.',  blanks:[{len:5}], answer:['DELHI'] },
    ],
    render:{ style:'boxes' }
  },
  // 7) Spot the Difference
  {
    meta:{branding:'© 2025 HMQUIZ • hmquiz.example', logo:'/logo.png', id:'p7',title:'Spot the Difference – Sample',subtitle:'Find 3 differences',difficulty:'easy',page_size:'A4'},
    type:'spot_the_difference',
    images:{
      left:{  src:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Example.jpg/400px-Example.jpg', alt:'Left'},
      right:{ src:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Example.jpg/400px-Example.jpg', alt:'Right'},
    },
    differences_required:3,
    answers:{ regions:[ {shape:'rect',x:40,y:40,w:60,h:30}, {shape:'rect',x:140,y:110,w:40,h:40} ] },
    render:{ width:320 }
  }
]
export default SAMPLE_DATA
