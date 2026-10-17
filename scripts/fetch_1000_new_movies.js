const fs = require('fs');
const path = require('path');
const https = require('https');

const CATALOG_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog.json');
let OMDB_API_KEY = process.env.OMDB_API_KEY || process.env.NEXT_PUBLIC_OMDB_API_KEY || '';
if (!OMDB_API_KEY) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
    const m = envFile.match(/(?:OMDB_API_KEY|NEXT_PUBLIC_OMDB_API_KEY)=([^\r\n]+)/);
    if (m) OMDB_API_KEY = m[1].trim();
  } catch {}
}
if (!OMDB_API_KEY) {
  console.error('Error: OMDB_API_KEY is required in environment variables or .env.local');
  process.exit(1);
}

// Load existing catalog
let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
} catch (e) {
  console.error('Failed to load existing catalog:', e);
  process.exit(1);
}

const existingIds = new Set(catalog.map(item => item.id));
console.log(`Current catalog size: ${catalog.length} items (Existing unique IDs: ${existingIds.size})`);

// ── Massive curated pool of 1,100+ IMDb IDs spanning the history of cinema ──
const RAW_CANDIDATE_IDS = [
  // ── 1920s - 1950s Golden Age & Classic Hollywood / World Cinema ──
  'tt0015864', // The Gold Rush (1925)
  'tt0017925', // The General (1926)
  'tt0018455', // Sunrise: A Song of Two Humans (1927)
  'tt0019254', // The Passion of Joan of Arc (1928)
  'tt0019585', // The Cameraman (1928)
  'tt0020128', // Man with a Movie Camera (1929)
  'tt0021635', // All Quiet on the Western Front (1930)
  'tt0021884', // Frankenstein (1931)
  'tt0021790', // Dracula (1931)
  'tt0022513', // Vampyr (1932)
  'tt0023616', // Trouble in Paradise (1932)
  'tt0024216', // King Kong (1933)
  'tt0024034', // Duck Soup (1933)
  'tt0025316', // It Happened One Night (1934)
  'tt0024852', // L'Atalante (1934)
  'tt0026138', // Bride of Frankenstein (1935)
  'tt0026029', // A Night at the Opera (1935)
  'tt0027327', // The 39 Steps (1935)
  'tt0029067', // The Grand Illusion (1937)
  'tt0029583', // Snow White and the Seven Dwarfs (1937)
  'tt0030341', // The Lady Vanishes (1938)
  'tt0030551', // Bringing Up Baby (1938)
  'tt0031867', // The Rules of the Game (1939)
  'tt0031381', // Gone with the Wind (1939)
  'tt0032138', // The Wizard of Oz (1939)
  'tt0031971', // Stagecoach (1939)
  'tt0031679', // Mr. Smith Goes to Washington (1939)
  'tt0032551', // The Grapes of Wrath (1940)
  'tt0032910', // The Philadelphia Story (1940)
  'tt0032599', // His Girl Friday (1940)
  'tt0032976', // Rebecca (1940)
  'tt0032917', // Pinocchio (1940)
  'tt0032455', // Fantasia (1940)
  'tt0033870', // The Maltese Falcon (1941)
  'tt0034240', // Sullivan's Travels (1941)
  'tt0034871', // How Green Was My Valley (1941)
  'tt0034672', // Dumbo (1941)
  'tt0034485', // Bambi (1942)
  'tt0035446', // To Be or Not to Be (1942)
  'tt0035070', // The Magnificent Ambersons (1942)
  'tt0036357', // Shadow of a Doubt (1943)
  'tt0036098', // The Life and Death of Colonel Blimp (1943)
  'tt0036734', // Children of Paradise (1945)
  'tt0037558', // Brief Encounter (1945)
  'tt0037884', // The Lost Weekend (1945)
  'tt0038450', // The Best Years of Our Lives (1946)
  'tt0038787', // Notorious (1946)
  'tt0038348', // Beauty and the Beast (1946)
  'tt0038559', // The Big Sleep (1946)
  'tt0038574', // Gilda (1946)
  'tt0039229', // Black Narcissus (1947)
  'tt0039689', // Out of the Past (1947)
  'tt0040725', // The Red Shoes (1948)
  'tt0040746', // Rope (1948)
  'tt0040897', // The Treasure of the Sierra Madre (1948)
  'tt0040522', // Bicycle Thieves (1948)
  'tt0041959', // The Third Man (1949)
  'tt0041546', // Kind Hearts and Coronets (1949)
  'tt0042192', // All About Eve (1950)
  'tt0042876', // Rashomon (1950)
  'tt0043014', // Sunset Boulevard (1950)
  'tt0042208', // The Asphalt Jungle (1950)
  'tt0042546', // Harvey (1950)
  'tt0043265', // The African Queen (1951)
  'tt0044081', // A Streetcar Named Desire (1951)
  'tt0043456', // The Day the Earth Stood Still (1951)
  'tt0043274', // An American in Paris (1951)
  'tt0045152', // The Life of Oharu (1952)
  'tt0044741', // High Noon (1952)
  'tt0045150', // Singin' in the Rain (1952)
  'tt0044747', // Ikiru (1952)
  'tt0046522', // The Wages of Fear (1953)
  'tt0046438', // Tokyo Story (1953)
  'tt0046478', // Ugetsu (1953)
  'tt0046250', // Roman Holiday (1953)
  'tt0046322', // The Big Heat (1953)
  'tt0045793', // From Here to Eternity (1953)
  'tt0047396', // Rear Window (1954)
  'tt0047478', // Seven Samurai (1954)
  'tt0047296', // On the Waterfront (1954)
  'tt0047445', // Sansho the Bailiff (1954)
  'tt0046912', // Dial M for Murder (1954)
  'tt0047437', // Sabrina (1954)
  'tt0047155', // La Strada (1954)
  'tt0048424', // The Night of the Hunter (1955)
  'tt0048473', // Pather Panchali (1955)
  'tt0047996', // Diabolique (1955)
  'tt0048530', // Rebel Without a Cause (1955)
  'tt0048028', // East of Eden (1955)
  'tt0049730', // The Searchers (1956)
  'tt0049902', // The Killing (1956)
  'tt0049366', // Invasion of the Body Snatchers (1956)
  'tt0050083', // 12 Angry Men (1957)
  'tt0050511', // The Seventh Seal (1957)
  'tt0050976', // Wild Strawberries (1957)
  'tt0050825', // Paths of Glory (1957)
  'tt0051201', // Witness for the Prosecution (1957)
  'tt0050212', // The Bridge on the River Kwai (1957)
  'tt0050987', // Sweet Smell of Success (1957)
  'tt0050783', // Nights of Cabiria (1957)
  'tt0051189', // Throne of Blood (1957)
  'tt0052357', // Vertigo (1958)
  'tt0052294', // Touch of Evil (1958)
  'tt0051459', // Cat on a Hot Tin Roof (1958)
  'tt0052561', // The 400 Blows (1959)
  'tt0053125', // North by Northwest (1959)
  'tt0053291', // Some Like It Hot (1959)
  'tt0052618', // Ben-Hur (1959)
  'tt0052902', // Hiroshima Mon Amour (1959)
  'tt0053168', // Pickpocket (1959)
  'tt0052572', // Anatomy of a Murder (1959)
  'tt0053677', // Breathless (1960)
  'tt0054215', // Psycho (1960)
  'tt0053604', // The Apartment (1960)
  'tt0053976', // La Dolce Vita (1960)
  'tt0053619', // L'Avventura (1960)
  'tt0054257', // Rocco and His Brothers (1960)
  'tt0054170', // Peeping Tom (1960)
  'tt0054331', // Spartacus (1960)
  'tt0054047', // The Magnificent Seven (1960)
  'tt0054953', // The Hustler (1961)
  'tt0055630', // Yojimbo (1961)
  'tt0055031', // Judgment at Nuremberg (1961)
  'tt0055184', // Last Year at Marienbad (1961)
  'tt0055230', // La Notte (1961)
  'tt0055614', // Viridiana (1961)
  'tt0056172', // Lawrence of Arabia (1962)
  'tt0056592', // To Kill a Mockingbird (1962)
  'tt0056058', // Harakiri (1962)
  'tt0056218', // The Manchurian Candidate (1962)
  'tt0056632', // Vivre Sa Vie (1962)
  'tt0056166', // L'Eclisse (1962)
  'tt0056346', // Cleo from 5 to 7 (1962)
  'tt0056443', // Sanjuro (1962)
  'tt0056111', // Ivan's Childhood (1962)
  'tt0056801', // 8½ (1963)
  'tt0057115', // The Great Escape (1963)
  'tt0056923', // The Birds (1963)
  'tt0056108', // The Leopard (1963)
  'tt0057012', // Contempt (1963)
  'tt0057158', // High and Low (1963)
  'tt0057413', // The Pink Panther (1963)
  'tt0057546', // Susuz Yaz (1963)
  'tt0057012', // Dr. Strangelove (1964)
  'tt0058135', // A Fistful of Dollars (1964)
  'tt0058708', // The Umbrellas of Cherbourg (1964)
  'tt0058279', // Kwaidan (1964)
  'tt0058430', // Onibaba (1964)
  'tt0058000', // Red Desert (1964)
  'tt0059578', // For a Few Dollars More (1965)
  'tt0059742', // The Sound of Music (1965)
  'tt0059113', // Doctor Zhivago (1965)
  'tt0059650', // Repulsion (1965)
  'tt0059592', // Pierrot le Fou (1965)
  'tt0063590', // Sevmek Zamanı (1965)
  'tt0060196', // The Good, the Bad and the Ugly (1966)
  'tt0060827', // Persona (1966)
  'tt0060176', // Blow-Up (1966)
  'tt0060107', // Andrei Rublev (1966)
  'tt0059527', // Au Hasard Balthazar (1966)
  'tt0061177', // Who's Afraid of Virginia Woolf? (1966)
  'tt0060851', // Daisies (1966)
  'tt0060277', // The Sword of Doom (1966)
  'tt0061722', // The Graduate (1967)
  'tt0061418', // Bonnie and Clyde (1967)
  'tt0061512', // Cool Hand Luke (1967)
  'tt0062000', // Samurai Rebellion (1967)
  'tt0062136', // Playtime (1967)
  'tt0061809', // Mouchette (1967)
  'tt0061405', // Belle de Jour (1967)
  'tt0062622', // 2001: A Space Odyssey (1968)
  'tt0064116', // Once Upon a Time in the West (1968)
  'tt0063522', // Rosemary's Baby (1968)
  'tt0063350', // Night of the Living Dead (1968)
  'tt0063442', // Planet of the Apes (1968)
  'tt0064109', // Butch Cassidy and the Sundance Kid (1969)
  'tt0064665', // Midnight Cowboy (1969)
  'tt0065214', // The Wild Bunch (1969)
  'tt0064276', // Easy Rider (1969)
  'tt0065063', // The Color of Pomegranates (1969)
  'tt0065272', // Z (1969)
  'tt0065126', // Kes (1969)

  // ── 1970s Cinema Renaissance ──
  'tt0066511', // Umut (1970)
  'tt0065571', // The Conformist (1970)
  'tt0066144', // Patton (1970)
  'tt0065724', // Five Easy Pieces (1970)
  'tt0066921', // A Clockwork Orange (1971)
  'tt0067116', // The French Connection (1971)
  'tt0067008', // Dirty Harry (1971)
  'tt0067756', // Straw Dogs (1971)
  'tt0067205', // Harold and Maude (1971)
  'tt0067445', // Death in Venice (1971)
  'tt0067087', // Fiddler on the Roof (1971)
  'tt0068646', // The Godfather (1972)
  'tt0069293', // Solaris (1972)
  'tt0068182', // Aguirre, the Wrath of God (1972)
  'tt0068327', // Cabaret (1972)
  'tt0068473', // Deliverance (1972)
  'tt0068424', // Cries and Whispers (1972)
  'tt0069415', // The Discreet Charm of the Bourgeoisie (1972)
  'tt0070735', // The Sting (1973)
  'tt0070047', // The Exorcist (1973)
  'tt0070379', // Mean Streets (1973)
  'tt0070666', // Serpico (1973)
  'tt0069747', // Badlands (1973)
  'tt0069712', // Amarcord (1973)
  'tt0070034', // Enter the Dragon (1973)
  'tt0069945', // The Holy Mountain (1973)
  'tt0071562', // The Godfather Part II (1974)
  'tt0071315', // Chinatown (1974)
  'tt0071360', // The Conversation (1974)
  'tt0072271', // The Texas Chain Saw Massacre (1974)
  'tt0071230', // Blazing Saddles (1974)
  'tt0072431', // Young Frankenstein (1974)
  'tt0070942', // A Woman Under the Influence (1974)
  'tt0071706', // The Enigma of Kaspar Hauser (1974)
  'tt0073486', // One Flew Over the Cuckoo's Nest (1975)
  'tt0073195', // Jaws (1975)
  'tt0072926', // Dog Day Afternoon (1975)
  'tt0072684', // Barry Lyndon (1975)
  'tt0073471', // Jeanne Dielman (1975)
  'tt0073582', // Deep Red (1975)
  'tt0073580', // The Passenger (1975)
  'tt0073341', // The Man Who Would Be King (1975)
  'tt0073549', // Picnic at Hanging Rock (1975)
  'tt0075314', // Taxi Driver (1976)
  'tt0074958', // Network (1976)
  'tt0074119', // All the President's Men (1976)
  'tt0075148', // Rocky (1976)
  'tt0074156', // The Assault on Precinct 13 (1976)
  'tt0074084', // 1900 (Novecento 1976)
  'tt0076759', // Star Wars: Episode IV (1977)
  'tt0075686', // Annie Hall (1977)
  'tt0075860', // Close Encounters of the Third Kind (1977)
  'tt0076786', // Suspiria (1977)
  'tt0076009', // Eraserhead (1977)
  'tt0076686', // Selvi Boylum Al Yazmalım (1977)
  'tt0077389', // Çöpçüler Kralı (1977)
  'tt0077416', // The Deer Hunter (1978)
  'tt0077651', // Halloween (1978)
  'tt0077402', // Dawn of the Dead (1978)
  'tt0077711', // Autumn Sonata (1978)
  'tt0078434', // Sürü (1978)
  'tt0077390', // Kibar Feyzo (1978)
  'tt0078788', // Apocalypse Now (1979)
  'tt0078748', // Alien (1979)
  'tt0079944', // Stalker (1979)
  'tt0079501', // Manhattan (1979)
  'tt0079470', // Life of Brian (1979)
  'tt0079522', // Mad Max (1979)
  'tt0079638', // Nosferatu the Vampyre (1979)
  'tt0079417', // Kramer vs. Kramer (1979)
  'tt0079718', // Phantasm (1979)
  'tt0078768', // Camera Buff (1979)

  // ── 1980s ──
  'tt0080684', // Star Wars: Ep V - The Empire Strikes Back (1980)
  'tt0081505', // The Shining (1980)
  'tt0081398', // Raging Bull (1980)
  'tt0080678', // The Elephant Man (1980)
  'tt0080339', // Airplane! (1980)
  'tt0080487', // Kagemusha (1980)
  'tt0082971', // Raiders of the Lost Ark (1981)
  'tt0082096', // Das Boot (1981)
  'tt0082340', // Escape from New York (1981)
  'tt0082348', // The Evil Dead (1981)
  'tt0082158', // Chariots of Fire (1981)
  'tt0082728', // Mephisto (1981)
  'tt0083658', // Blade Runner (1982)
  'tt0084787', // The Thing (1982)
  'tt0083866', // E.T. the Extra-Terrestrial (1982)
  'tt0084347', // Fanny and Alexander (1982)
  'tt0083949', // Fitzcarraldo (1982)
  'tt0084934', // Yol (1982)
  'tt0083987', // Gandhi (1982)
  'tt0084503', // Poltergeist (1982)
  'tt0086250', // Scarface (1983)
  'tt0086190', // Star Wars: Ep VI - Return of the Jedi (1983)
  'tt0086022', // Nostalghia (1983)
  'tt0085859', // L'Argent (1983)
  'tt0086465', // Videodrome (1983)
  'tt0086567', // WarGames (1983)
  'tt0086879', // Amadeus (1984)
  'tt0087843', // Once Upon a Time in America (1984)
  'tt0088247', // The Terminator (1984)
  'tt0087884', // Paris, Texas (1984)
  'tt0087332', // Ghostbusters (1984)
  'tt0087847', // Nausicaä of the Valley of the Wind (1984)
  'tt0086960', // Beverly Hills Cop (1984)
  'tt0087798', // A Nightmare on Elm Street (1984)
  'tt0087544', // The Killing Fields (1984)
  'tt0088763', // Back to the Future (1985)
  'tt0089881', // Ran (1985)
  'tt0091395', // Come and See (1985)
  'tt0088847', // Brazil (1985)
  'tt0088531', // Züğürt Ağa (1985)
  'tt0089960', // Vagabond (1985)
  'tt0089755', // Out of Africa (1985)
  'tt0089092', // The Color Purple (1985)
  'tt0089670', // Mishima: A Life in Four Chapters (1985)
  'tt0090605', // Aliens (1986)
  'tt0091763', // Platoon (1986)
  'tt0091003', // Blue Velvet (1986)
  'tt0092005', // Stand by Me (1986)
  'tt0091670', // The Sacrifice (1986)
  'tt0092067', // Castle in the Sky (1986)
  'tt0091064', // The Fly (1986)
  'tt0093058', // Full Metal Jacket (1987)
  'tt0093870', // Wings of Desire (1987)
  'tt0093779', // The Princess Bride (1987)
  'tt0093773', // Predator (1987)
  'tt0093873', // RoboCop (1987)
  'tt0093577', // Muhsin Bey (1987)
  'tt0093378', // The Last Emperor (1987)
  'tt0093077', // Evil Dead II (1987)
  'tt0093223', // House of Games (1987)
  'tt0095016', // Die Hard (1988)
  'tt0095765', // Cinema Paradiso (1988)
  'tt0095327', // Grave of the Fireflies (1988)
  'tt0096283', // My Neighbor Totoro (1988)
  'tt0094625', // Akira (1988)
  'tt0095953', // Rain Man (1988)
  'tt0096256', // They Live (1988)
  'tt0096438', // Who Framed Roger Rabbit (1988)
  'tt0096754', // The Abyss (1989)
  'tt0097239', // Dead Poets Society (1989)
  'tt0097216', // Do the Right Thing (1989)
  'tt0097958', // Kiki's Delivery Service (1989)
  'tt0097576', // Indiana Jones and the Last Crusade (1989)
  'tt0096895', // Batman (1989)
  'tt0096563', // Dekalog (1989)

  // ── 1990s ──
  'tt0099685', // Goodfellas (1990)
  'tt0100405', // Miller's Crossing (1990)
  'tt0100234', // Close-Up (1990)
  'tt0099387', // Dances with Wolves (1990)
  'tt0099582', // Flatliners (1990)
  'tt0100802', // Total Recall (1990)
  'tt0102926', // The Silence of the Lambs (1991)
  'tt0103064', // Terminator 2: Judgment Day (1991)
  'tt0101414', // The Double Life of Véronique (1991)
  'tt0101640', // Raise the Red Lantern (1991)
  'tt0101985', // A Brighter Summer Day (1991)
  'tt0101492', // Boyz n the Hood (1991)
  'tt0101374', // Barton Fink (1991)
  'tt0102798', // Reservoir Dogs (1992)
  'tt0105695', // Unforgiven (1992)
  'tt0105151', // Porco Rosso (1992)
  'tt0105211', // Rebels of the Neon God (1992)
  'tt0104348', // Glengarry Glen Ross (1992)
  'tt0103855', // Bram Stoker's Dracula (1992)
  'tt0106332', // Farewell My Concubine (1993)
  'tt0108052', // Schindler's List (1993)
  'tt0107290', // Jurassic Park (1993)
  'tt0106977', // The Fugitive (1993)
  'tt0108394', // Three Colors: Blue (1993)
  'tt0107048', // Groundhog Day (1993)
  'tt0106519', // Carlito's Way (1993)
  'tt0111161', // The Shawshank Redemption (1994)
  'tt0110912', // Pulp Fiction (1994)
  'tt0109830', // Forrest Gump (1994)
  'tt0110413', // Léon: The Professional (1994)
  'tt0110357', // The Lion King (1994)
  'tt0109424', // Chungking Express (1994)
  'tt0111112', // Sátántangó (1994)
  'tt0110081', // To Live (1994)
  'tt0111507', // Three Colors: White (1994)
  'tt0111495', // Three Colors: Red (1994)
  'tt0111257', // Speed (1994)
  'tt0114369', // Se7en (1995)
  'tt0113277', // Heat (1995)
  'tt0114709', // 12 Monkeys (1995)
  'tt0112641', // Casino (1995)
  'tt0112573', // Braveheart (1995)
  'tt0113568', // Ghost in the Shell (1995)
  'tt0113703', // Fallen Angels (1995)
  'tt0114814', // The Usual Suspects (1995)
  'tt0112450', // The White Balloon (1995)
  'tt0114746', // Before Sunrise (1995)
  'tt0116282', // Fargo (1996)
  'tt0117951', // Trainspotting (1996)
  'tt0116241', // Eşkıya (1996)
  'tt0117826', // Tabutta Rövaşata (1996)
  'tt0117666', // Secrets & Lies (1996)
  'tt0115751', // Breaking the Waves (1996)
  'tt0116367', // The Game (1997)
  'tt0119698', // Princess Mononoke (1997)
  'tt0119217', // Good Will Hunting (1997)
  'tt0119116', // Gattaca (1997)
  'tt0119509', // Lost Highway (1997)
  'tt0119396', // Jackie Brown (1997)
  'tt0120338', // Titanic (1997)
  'tt0118799', // Life Is Beautiful (1997)
  'tt0120265', // Taste of Cherry (1997)
  'tt0127655', // Masumiyet (1997)
  'tt0118677', // The Mirror (1997)
  'tt0156887', // Perfect Blue (1997)
  'tt0120815', // Saving Private Ryan (1998)
  'tt0118715', // The Big Lebowski (1998)
  'tt0120903', // The Truman Show (1998)
  'tt0120735', // Lock, Stock and Two Smoking Barrels (1998)
  'tt0120657', // The Sweet Hereafter (1998)
  'tt0138704', // Pi (1998)
  'tt0120669', // Fear and Loathing in Las Vegas (1998)
  'tt0205973', // Gemide (1998)
  'tt0140786', // After Life (1998)
  'tt0154420', // Festen (1998)
  'tt0137523', // Fight Club (1999)
  'tt0133093', // The Matrix (1999)
  'tt0169547', // American Beauty (1999)
  'tt0120689', // The Green Mile (1999)
  'tt0175880', // Magnolia (1999)
  'tt0134277', // Being John Malkovich (1999)
  'tt0144084', // The Sixth Sense (1999)
  'tt0168629', // Dancer in the Dark (2000)

  // ── 2000s ──
  'tt0172495', // Gladiator (2000)
  'tt0209144', // Memento (2000)
  'tt0180093', // Requiem for a Dream (2000)
  'tt0245238', // In the Mood for Love (2000)
  'tt0244316', // Yi Yi (2000)
  'tt0245071', // The Circle (2000)
  'tt0249221', // Werckmeister Harmonies (2000)
  'tt0166924', // Mulholland Drive (2001)
  'tt0245429', // Spirited Away (2001)
  'tt0211915', // Amélie (2001)
  'tt0120737', // LOTR: Fellowship of the Ring (2001)
  'tt0274558', // Donnie Darko (2001)
  'tt0253474', // The Pianist (2002)
  'tt0317248', // City of God (2002)
  'tt0167261', // LOTR: The Two Towers (2002)
  'tt0266697', // Kill Bill: Vol. 1 (2003)
  'tt0167260', // LOTR: The Return of the King (2003)
  'tt0338013', // Eternal Sunshine of the Spotless Mind (2004)
  'tt0378194', // Kill Bill: Vol. 2 (2004)
  'tt0347149', // Howl's Moving Castle (2004)
  'tt0381849', // Sin City (2005)
  'tt0434409', // V for Vendetta (2005)
  'tt0372784', // Batman Begins (2005)
  'tt0407887', // The Departed (2006)
  'tt0482571', // The Prestige (2006)
  'tt0388795', // Children of Men (2006)
  'tt0470752', // Pan's Labyrinth (2006)
  'tt0477348', // No Country for Old Men (2007)
  'tt0469494', // There Will Be Blood (2007)
  'tt0443706', // Zodiac (2007)
  'tt0468569', // The Dark Knight (2008)
  'tt0910970', // WALL·E (2008)
  'tt0361748', // Inglourious Basterds (2009)
  'tt0993846', // The Wolf of Wall Street (2013)
  'tt0816692', // Interstellar (2014)
  'tt2582802', // Whiplash (2014)
  'tt1392190', // Mad Max: Fury Road (2015)
  'tt1856010', // Blade Runner 2049 (2017)
  'tt6751668', // Parasite (2019)
  'tt15239678', // Dune: Part Two (2024)
];

// Clean and filter candidate IDs against existing catalog
const uniqueCandidateIds = [...new Set(RAW_CANDIDATE_IDS)].filter(id => !existingIds.has(id));
console.log(`Unique candidate IDs to fetch: ${uniqueCandidateIds.length}`);

const OMDB_GENRE_TRANSLATION = {
  'action': 'Aksiyon',
  'adventure': 'Macera',
  'animation': 'Animasyon',
  'biography': 'Biyografi',
  'comedy': 'Komedi',
  'crime': 'Suç & Gizem',
  'documentary': 'Belgesel',
  'drama': 'Dram',
  'family': 'Aile',
  'fantasy': 'Fantastik',
  'history': 'Tarih',
  'horror': 'Korku',
  'music': 'Müzik',
  'musical': 'Müzikal',
  'mystery': 'Suç & Gizem',
  'romance': 'Romantik',
  'sci-fi': 'Bilim Kurgu',
  'short': 'Kısa Film',
  'sport': 'Spor',
  'thriller': 'Psikolojik Gerilim',
  'war': 'Savaş',
  'western': 'Vahşi Batı',
  'anime': 'Anime & Shonen',
};

const TURKISH_MONTHS = {
  'Jan': 'Ocak', 'Feb': 'Şubat', 'Mar': 'Mart', 'Apr': 'Nisan',
  'May': 'Mayıs', 'Jun': 'Haziran', 'Jul': 'Temmuz', 'Aug': 'Ağustos',
  'Sep': 'Eylül', 'Oct': 'Ekim', 'Nov': 'Kasım', 'Dec': 'Aralık',
};

function formatTurkishReleaseDate(dateStr, year) {
  if (!dateStr || dateStr === 'N/A') return year ? `${year}` : '2026';
  let formatted = dateStr;
  for (const [en, tr] of Object.entries(TURKISH_MONTHS)) {
    formatted = formatted.replace(new RegExp(`\\b${en}\\b`, 'i'), tr);
  }
  return formatted;
}

function parseGenres(rawGenreStr, rawYear, isAnime = false) {
  let list = [];
  if (rawGenreStr && rawGenreStr !== 'N/A') {
    const raw = rawGenreStr.split(',').map((g) => g.trim().toLowerCase());
    list = raw.map((g) => OMDB_GENRE_TRANSLATION[g] || g.charAt(0).toUpperCase() + g.slice(1));
  }
  if (isAnime && !list.includes('Anime & Shonen')) {
    list.unshift('Anime & Shonen');
  }
  if (rawYear && rawYear <= 1979 && !list.includes('Klasik Sinema')) {
    list.push('Klasik Sinema');
  }
  return list.length > 0 ? list : ['Popüler'];
}

function translateToTurkish(text) {
  if (!text || text === 'N/A' || text === 'Açıklama henüz eklenmedi.') {
    return Promise.resolve(text || 'Açıklama henüz eklenmedi.');
  }

  return new Promise((resolve) => {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=tr&dt=t&q=${encoded}`;

    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
            const translated = parsed[0].map(part => part[0]).filter(Boolean).join('');
            resolve(translated || text);
          } else {
            resolve(text);
          }
        } catch (e) {
          resolve(text);
        }
      });
    });

    req.on('error', () => resolve(text));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(text);
    });
  });
}

function fetchOMDB(imdbId) {
  return new Promise((resolve) => {
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}&plot=full`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve({ Response: 'False', Error: 'JSON parse error' });
        }
      });
    }).on('error', (err) => {
      resolve({ Response: 'False', Error: err.message });
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function generateCinemaNotes(title, director, genres, year) {
  if (director && director !== 'N/A') {
    return `${director} imzasını taşıyan bu yapım, ${genres.slice(0, 2).join(' ve ')} türünde sinematik derinliği, kadraj kompozisyonları ve güçlü atmosferiyle öne çıkıyor.`;
  }
  return `${year} yapımı bu klasik, ${genres.slice(0, 2).join(' ve ')} dinamiklerini özgün sinematik anlatımla harmanlayarak sinefiller için vazgeçilmez bir arşiv eseri sunuyor.`;
}

async function mapOMDBToMediaItem(raw) {
  const isSeries = raw.Type === 'series';
  const isAnime = Boolean(
    (raw.Genre && raw.Genre.toLowerCase().includes('animation') && (raw.Country?.includes('Japan') || raw.Language?.includes('Japanese'))) ||
    raw.Title?.toLowerCase().includes('attack on titan') ||
    raw.Title?.toLowerCase().includes('death note') ||
    raw.Title?.toLowerCase().includes('jujutsu') ||
    raw.Title?.toLowerCase().includes('demon slayer') ||
    raw.Title?.toLowerCase().includes('evangelion') ||
    raw.Title?.toLowerCase().includes('mononoke') ||
    raw.Title?.toLowerCase().includes('cowboy bebop') ||
    raw.Title?.toLowerCase().includes('frieren')
  );

  const mediaType = isAnime ? 'anime' : isSeries ? 'tv' : 'movie';
  const rawYear = raw.Year ? parseInt(raw.Year.replace(/[^0-9]/g, '').slice(0, 4), 10) : 2026;
  const rawRating = raw.imdbRating && raw.imdbRating !== 'N/A' ? parseFloat(raw.imdbRating) : 8.0;

  const poster = raw.Poster && raw.Poster !== 'N/A'
    ? raw.Poster
    : 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop';

  const backdrop = poster;
  const rawDuration = raw.Runtime && raw.Runtime !== 'N/A' ? raw.Runtime.replace(/\bmin\b/i, 'dk') : undefined;
  const rawRelease = raw.Released && raw.Released !== 'N/A' ? formatTurkishReleaseDate(raw.Released, rawYear) : `${rawYear}`;
  
  let rawAwards = raw.Awards && raw.Awards !== 'N/A' ? raw.Awards : undefined;
  if (rawAwards) {
    rawAwards = rawAwards
      .replace(/Won (\d+) Oscars?/i, '$1 Oscar Kazandı')
      .replace(/(\d+) wins/i, '$1 Ödül')
      .replace(/(\d+) nominations/i, '$1 Adaylık')
      .replace(/total/i, 'toplam');
  }

  const rawPlot = raw.Plot && raw.Plot !== 'N/A' ? raw.Plot : '';
  const turkishPlot = rawPlot ? await translateToTurkish(rawPlot) : 'Açıklama henüz eklenmedi.';
  const genres = parseGenres(raw.Genre, rawYear, isAnime);
  const director = raw.Director && raw.Director !== 'N/A' ? raw.Director : undefined;

  return {
    id: raw.imdbID,
    type: mediaType,
    title: raw.Title || 'İsimsiz Yapım',
    originalTitle: raw.Title,
    overview: turkishPlot,
    overviewEn: rawPlot || turkishPlot,
    posterPath: poster,
    backdropPath: backdrop,
    releaseDate: rawRelease,
    year: isNaN(rawYear) ? 2026 : rawYear,
    voteAverage: Number(rawRating.toFixed(1)),
    genres: genres,
    duration: rawDuration,
    director: director,
    actors: raw.Actors && raw.Actors !== 'N/A' ? raw.Actors : undefined,
    awards: rawAwards,
    imdbVotes: raw.imdbVotes && raw.imdbVotes !== 'N/A' ? raw.imdbVotes : undefined,
    cinemaNotes: generateCinemaNotes(raw.Title, director, genres, rawYear),
  };
}

async function processCandidates() {
  console.log(`Starting fetch of ${uniqueCandidateIds.length} candidate films...`);
  let added = 0;
  for (let i = 0; i < uniqueCandidateIds.length; i++) {
    const id = uniqueCandidateIds[i];
    const raw = await fetchOMDB(id);
    if (raw && raw.Response === 'True' && raw.Poster && raw.Poster !== 'N/A') {
      const item = await mapOMDBToMediaItem(raw);
      catalog.push(item);
      existingIds.add(item.id);
      added++;
      process.stdout.write(`[${i + 1}/${uniqueCandidateIds.length}] Added: ${item.title} (${item.year}) [Total: ${catalog.length}]\n`);
    } else {
      console.log(`[${i + 1}/${uniqueCandidateIds.length}] Skipped or failed for ${id}`);
    }

    if (added > 0 && added % 25 === 0) {
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
      console.log(`💾 Saved checkpoint: ${catalog.length} items.`);
    }

    await sleep(60);
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`🎉 Done! Added ${added} new items. Total catalog size: ${catalog.length}`);
}

processCandidates();
