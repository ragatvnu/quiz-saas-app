const SAMPLE_DATA = [
  {
    meta:{id:'p1',title:'Odd One Out – Sample',subtitle:'Find the one that doesn’t match',difficulty:'easy',page_size:'US-Letter'},
    type:'odd_one_out',
    grid:{rows:3,cols:3,items:Array.from({length:9}).map((_,i)=>i===4?{ch:'😎'}:{ch:'😀'})},
    odd_index:4
  },
  {
    meta:{id:'p2',title:'Emoji Quiz – Sample',subtitle:'Guess the phrase',difficulty:'medium',page_size:'US-Letter'},
    type:'emoji_quiz',
    prompt:{tiles:[{ch:'🎥'},{ch:'⭐'}],instruction:'Guess the phrase'},
    answer:{text:'Movie Star'}
  },
  {
    meta:{id:'p3',title:'Word Search – Fruits',subtitle:'Find all the fruits',difficulty:'medium',page_size:'US-Letter'},
    type:'word_search',
    grid:{rows:5,cols:5,letters:"APPLEBANANAGRAPELEMOM".split("")},
    word_list:['APPLE','BANANA','GRAPE'],
    answers:[{word:'APPLE',cells:[[1,1],[1,2],[1,3],[1,4],[1,5]]}]
  }
]
export default SAMPLE_DATA
