update private.game_challenge_keys as k
set answer=v.answer
from (values
 ('acentuacao',3,'pôde'),
 ('acentuacao',4,'órgão'),
 ('acentuacao',5,'têm'),
 ('desafio-pronomes',3,'Quem'),
 ('desafio-pronomes',4,'Possessivo'),
 ('desafio-pronomes',5,'Lhes'),
 ('identifique-adjetivos',3,'Brilhante'),
 ('identifique-adjetivos',4,'Macio'),
 ('identifique-adjetivos',5,'Generosa'),
 ('sinonimos-antonimos',3,'Veloz'),
 ('sinonimos-antonimos',4,'Restrito'),
 ('sinonimos-antonimos',5,'Começar'),
 ('homonimos-paronimos',3,'Seção'),
 ('homonimos-paronimos',4,'Descrição'),
 ('homonimos-paronimos',5,'Comprimento'),
 ('figuras-linguagem',3,'Antítese'),
 ('figuras-linguagem',4,'Eufemismo'),
 ('figuras-linguagem',5,'Comparação'),
 ('pontuacao',3,':'),
 ('pontuacao',4,'—'),
 ('pontuacao',5,'...'),
 ('concordancia',3,'chegaram'),
 ('concordancia',4,'anexas'),
 ('concordancia',5,'meio')
) as v(game_slug,challenge_index,answer)
where k.game_slug=v.game_slug and k.challenge_index=v.challenge_index;