# zenos

Building a 2D game engine from scratch using canvas and js for testing purposes.

This project is a remembrance and a tribute to the awesome and wonderful **8-bit Gauntlet** (nintendinho :heart:)!

```
It will be converted to a React application soon!
```

## Player entity

### Base features
 * Name, Life, Shoot, Shield and Speed.
 * Show current direction.
 * Can move, change speed, hit or be hitted (melee or ranged).
 * Blinks when shoot or loses life.

### Json element
 * **idPlayer**: Mandatory. A number that specifies a unique identifier for the player.
 * **name**: Mandatory. The name of the player.
 * **life**: Mandatory. When it reaches zero game ends.
 * **damageTakenFactor**: Optional (default 50). It is like the armor, but the less the better.
   > Don't go above 50 or it will become less usefull
 * **timeBetweenHits**: Optional (default 450). It is the time between player hits.
   > In miliseconds - not applicable for shooting hits, only melee
 * **type**: Mandatory. It is a number. Every element in the map has a type.
   > See more about element types below - we use type 3 for players (a type 3 can hit)
 * **radius** or **width**/**height**: Mandatory exclusive. Radius for circles, Width/Height for rectangles. It is the body hit box.
 * **x**: Mandatory. The current position in x axis. Coordinate x.
 * **y**: Mandatory. The current position in y axis. Coordinate y.
 * **currentDirection**: Optional. Must have for getting and drawning player looking direction.
   > See more about element directions below - we may use 1 for starting players in the map (East)
 * **hitBonus**: Optional - zero bonus if not present. It is the **bonus damage** or the life gained to the target (if negative).
   > Only applicable if the origin element type **can hit** and the target has a **life property**
 * **style**: Defines the style of the player drawn - hitbox body and details.
    * **color**: This property is mandatory for the hitbox body.
        * **body**: Mandatory. Body background filler. Can be:
            1. Solid color
            2. Background-image (repeat / no-repeat / repeat-x / repeat-y)
            3. Canvas gradient fill style (linear or radial)
          > Body receives the image when using images or sprites
        * **details**: Optional. In current case, used to drawn player directions.
    * **border**: Optional. Enables drawn colored borders around the player hit box.
        * **width**: The border width (in pixels).
        * **color**: The border color.
 * **step**: Mandatory. Applicable for player's movement:
    * **x**: Moving speed at x axis.
    * **y**: Moving speed at y axis.
    * **increment**: The value used to increase or decrease the moving speed.
    * **xMax**: The maximum moving speed at x axis.
    * **yMax**: The maximum moving speed at y axis.
 * **skills**: Are the player skills that can be used in the game:
    * **shield**:
        * **isShieldUpColor**: Optional (default lightcyan). The color of the skill when up.
        * **shieldReduceFactor**: Optional (default 2). The received damage reduction factor.
        * **shieldBreakAmount**: Optional (default 5). Max counter for hits blocked before consuming a shield charge.
        * **charges**: Mandatory. How many charges the player have.
    * **shoot**:
        * **isShootingColor**: Optional (default lightcyan). The color of the skill when used.
        * **shootSpeed**: Optional (default 10). The shot speed in the map.
        * **charges**: Mandatory. How many ammo charges the player have.
          > Use -1 for infinite ammo
        * **baseElement**: Mandatory. It is a real time generated element (object) with type 9 and a bonus hit.
          > Base elements must have an extra mandatory property called **ref**
          > - This **ref** property can use following values: **301** (if it comes from players) or **101**/**201** (if it comes from environment)

### Temporary json bindings at execution time
 * **_isShooting**: true when element is shooting.
 * **_isTakingDamage**: true when element is taking damage.
 * **_isShieldUp**: true when element shield is up.
 * **_shieldBreakAmount**: current counter for hits blocked until shield consumes one charge.
 * **_isTimeBetweenHits**: must be lower than next hit time for a hit to be cast (miliseconds).
 * **_savedBody**: for blinking style body color of element (when taking damage).
 * **_savedDetails**: for blinking style details color of element (when shooting).

### Defaults only values
 * **elementTypesCanHit**: Array indicating which element types can hit (3, 5, 7, 9, 11, 101, 201, 301).
 * **isTakingDamageColor**: The color of the element when taking damage (red).
 * **shieldCap**: Shield background color.

## Map entity

### Base features
 * Its is the basic rectangle area where all elements of the game will exists.
 * Auto scrolling if the size of the map is bigger than screen.
 * Automatic async preload all background images based on json data.
 * Automatic preload all sound effects from the map.
 * Personalized styles (backgrounds, borders, colors, sounds).

### Secondary Jsons - attached to the Json element (primary)
 * **mapsSounds**
    * **idMap**: Mandatory. A number that specifies a unique identifier for the map.
    * **effects**: Mandatory. Array containing **all the sounds** to be played inside the map.
 * **mapsFillSpecial**
    * **idMap**: Mandatory. A number that specifies a unique identifier for the map.
    * **fillers**: Mandatory. Array containing **all the fill styles** that are personalized for map elements.

### Json element (primary)
 * **idMap**: Mandatory. A number that specifies a unique identifier for the map.
 * **name**: Mandatory. The name of the map.
 * **timer**: Mandatory. Map timer - when it reachs zero game ends.
 * **baseLineWidth**: Mandatory. Map border thickness.
 * **style**:
    * **outline**: Mandatory. Map border color.
    * **fillStyle**: Mandatory. Map background filler. Can be:
        1. Solid color
        2. Background-image (repeat / no-repeat / repeat-x / repeat-y)
        3. Canvas gradient fill style (linear or radial)
 * **players**:
    * **startPointX**: Optional - zero if not present. Base map coordinate in x axis where players will be loaded first.
      > Use 'mid' to load them in the mid of screen (x axis)
    * **startPointY**: Optional - zero if not present. Base map coordinate in y axis where players will be loaded first.
      > Use 'mid' to load them in the mid of screen (y axis)
* **elements**: Mandatory. Array containing **all the elements** that exists inside the map (map elements).
  > See more about map elements below

## Map elements entities
 * Array containing **all the elements** that exists inside the map (map elements).
 * Can be structures, walls, towers, doors, keys, food, ornaments, objects, monsters, ...
 * If it has a life property, can use a moving "aggro" algoritm.
 * Element aggro range increases when get hitted by a player.
 * Line of sight (los) algoritm may help avoid aggro.
 * Can have action skills like hit, shield or shooting.

### Json element
 * **id**: Mandatory. A number that specifies a unique identifier for the element.
   > **Only map elements can have** a property called id - players and map objects must have an id, but not called this way
 * **name**: Optional. The name of the element. Can appear at hit log.
 * **life**: Optional. If the element has a life property it can take hits and be destroyed.
   > If life property exists, when it reaches zero the element will disappear from the map
 * **damageTakenFactor**: Only applicable if element has a life property (default 50). It is like the armor, but the less the better.
   > Don't go above 50 or it will become less usefull
 * **timeBetweenHits**: Only applicable if element type can hit (default 450). It is the time between element hits.
   > In miliseconds -  melee or ranged (if applicable)
 * **type**: Mandatory. It is a number. Every element in the map has a type.
   > See more about element types below
 * **radius** or **width**/**height**: Mandatory exclusive. Radius for circles, Width/Height for rectangles. It is the body hit box.
 * **rotate**: Optional. Only valid for rectagles. Rotate the map element in degrees.
   > The rotate property **does not work** with collisions!
 * **x**: Mandatory. The current position in x axis. Coordinate x.
 * **y**: Mandatory. The current position in y axis. Coordinate y.
 * **currentDirection**: Optional. Must have for getting and drawning element looking direction.
   > See more about element directions below - we may check element direction table when starting elements in the map
 * **hitBonus**: Optional - zero bonus if not present. It is the **bonus damage** or the life gained to the target (if negative).
   > Only applicable if the origin element type **can hit** and the target has a **life property**
 * **aggroRange**: Optional (default 200). Range (in pixels) where a player can get aggroed by a map element.
   > A map element can be aggressive (aggro) only if it has a **life** property and **aggroRange** property value **is not equal -1**
   > - Player hits **increase aggro range**
 * **aggroGroup**: Optional. A unique number. If any map element of the group get aggroed by a player, the **whole group** will.
   > Map elements of the **same aggro group** can not hit or be hitted between themselves
 * **hitPauseTimeCheck**: Optional (default [5, 5000]). For hitting pause time checks, only for map elements that can shoot.
   > [maxHitTrigger ,timeToWait] - **maxHitTrigger** is a positive integer, **timeToWait** in miliseconds
 * **style**: Defines the style of the map element drawn - hitbox body and details.
    * **color**: This property is mandatory for the hitbox body.
        * **body**: Mandatory. Body background filler. Can be:
            1. Solid color
            2. Background-image (repeat / no-repeat / repeat-x / repeat-y)
            3. Canvas gradient fill style (linear or radial)
          > Body receives the image when using images or sprites
        * **details**: Optional. In current case, used to drawn map element directions (if applicable).
    * **border**: Optional. Enables drawn colored borders around the map element hit box.
        * **width**: The border width (in pixels).
        * **color**: The border color.
 * **step**: Only applicable if element can move:
    * **x**: Moving speed at x axis.
    * **y**: Moving speed at y axis.
    * **rangeLimit**: Optional. Defines boundaries limits in x and y axis for movement (if specified, at least one is mandatory):
        * **minX**: Minimum x coordinate accepted for movement, in normal conditions.
        * **maxX**: Maximum x coordinate accepted for movement, in normal conditions.
        * **minY**: Minimum y coordinate accepted for movement, in normal conditions.
        * **maxY**: Maximum y coordinate accepted for movement, in normal conditions.
 * **skills**: Are the map elements skills (optional):
    * **shield**:
        * **isShieldUpColor**: Optional (default lightcyan). The color of the skill when up.
        * **shieldReduceFactor**: Optional (default 2). The received damage reduction factor.
        * **shieldBreakAmount**: Optional (default 5). Max counter for hits blocked before consuming a shield charge.
        * **charges**: Mandatory. How many charges the map element have.
    * **shoot**:
        * **isShootingColor**: Optional (default lightcyan). The color of the skill when used.
        * **shootSpeed**: Optional (default 10). The shot speed in the map.
        * **charges**: Mandatory. How many ammo charges the map element have.
          > Use -1 for infinite ammo
        * **baseElement**: Mandatory. It is a real time generated element (object) with type 9 and a bonus hit.
          > Base elements must have an extra mandatory property called **ref**
          > - This **ref** property can use following values: **301** (if it comes from players) or **101**/**201** (if it comes from environment)

### Temporary json bindings at execution time
 * **_isShooting**: true when element is shooting.
 * **_isTakingDamage**: true when element is taking damage.
 * **_isShieldUp**: true when element shield is up.
 * **_shieldBreakAmount**: current counter for hits blocked until shield consumes one charge.
 * **_isTimeBetweenShieldUps**: must be lower than next shield up delay for a new charge to be cast (miliseconds).
   > Does not exists for players
 * **_isTimeBetweenHits**: must be lower than next hit time for a hit to be cast (miliseconds).
 * **_isTimeBetweenShootingHits** must be lower than next hit time for a ranged shooting hit to be cast (miliseconds).
   > Does not exists for players
 * **_savedBody**: for blinking style body color of element (when taking damage).
 * **_savedDetails**: for blinking style details color of element (when shooting).
 * **_savedX**: for map elements when getting aggro to save last step x value.
   > Does not exists for players
 * **_savedY**: for map elements when getting aggro to save last step y value.
   > Does not exists for players
 * **_hitAmount**: for map elements only when shooting: current counter for hit pause time checks.
   > Does not exists for players
 * _isAggroed - for map elements only that can be aggroed: true when element get aggroed by a player.
   > Does not exists for players

### Defaults only values
 * **elementTypesCanHit**: Array indicating which element types can hit (3, 5, 7, 9, 11, 101, 201, 301).
 * **isTakingDamageColor**: The color of the element when taking damage (red).
 * **shieldCap**: Shield background color.
 * **timeBetweenShieldUps**: Delay time between charges for skill shield to be up again (miliseconds)
   > Does not exists for players

## Element types
 * It is a number. Every element in the map has a type.
 * Each type defines an action associated when collision happens in the game.
 * Odd type numbers means the element can hit and do damage or rise life.
 * The act of collision have an **origin element** and a **target element**.
 * Existing types:
    + **1**. No collision, nothing happens
    + **2**. Collision &#8594; action: persistent, origin keeps movement - can hit: no
    + **3**. Collision &#8594; action: persistent, origin keeps movement - can hit: yes
    + **4**. Collision &#8594; action: persistent, origin stops movement at the collided axis - can hit: no
    + **5**. Collision &#8594; action: persistent, origin stops movement at the collided axis - can hit: yes
    + **6**. Collision &#8594; action: persistent, origin reverts movement at the collided axis - can hit: no
    + **7**. Collision &#8594; action: persistent, origin reverts movement at the collided axis - can hit: yes
    + **8**. Collision &#8594; action: disappear on every collision (as origin or as target) - can hit: no
    + **9**. Collision &#8594; action: disappear on every collision (as origin or as target) - can hit: yes
    + **10**. Collision &#8594; action: disappear only if receives the collision (as target) - can hit: no
    + **11**. Collision &#8594; action: disappear only if receives the collision (as target) - can hit: yes
    + **101**. Collision &#8594; action: persistent, origin keeps movement - can hit: yes (Platform mode)
      > An element in **platform mode** can have a direction but can not move (keep stacked in place)
    + **201**. Collision &#8594; action: persistent, origin keeps movement - can hit: yes (Mob type)
      > Type 201 is **only for mobs** (easy way to identify a mobile agressive map element)
    + **301**. Collision &#8594; action: persistent, origin keeps movement - can hit: yes (Player type)
      > Type 301 is **only for players** (easy way to identify a player map element)
 * Every element that has a life property will disappear if life reachs zero.

## Element directions
 * Elements can check and drawn it's current direction in the map during game play.
 * It is an optional feature. To be enable, the json element must have the property **currentDirection**.
    * The checking values are:
        + -11 &#8594; NW (North West)
        + -10 &#8594; N (North)
        + -9 &#8594; NE (North East)
        + -1 &#8594; W (West)
        + 1 &#8594; E (East)
        + 9 &#8594; SW (South West)
        + 10 &#8594; S (South)
        + 11 &#8594; SE (SouthEast)

## Elements collisions
 * "Circle x Circle".
   > **Disabled for now**, it needs a better collision penetration algoritm (in future)
 * "Rectangle x Rectangle".
   > Right now, every shape (rectangles, squares, circles, ...) acts as "Rectangle x Rectangle" collision
 * Configurable collisions actions.

## Elements physics
 * Elements iteration and Physics.
 * Elements change their speed based on their element types and related colision actions.

## Element actions and collision actions in the code
 * They are two very important parts in the engine structure.
 * We can create intelligent actions for the game, like new skills, keys, doors, move things, ... based on these areas.

## Games sounds
 * Music and effects.

##  Hit log screen
 * It is an option in the game menu.
 * Shows hit logs in the game with some details, like: hit value, hit bonus, damage taken factor and reduce factor.

## Tips
 * Using circle (radius) for players and mobs hit boxes will improve aggro collisions when having multiple mobs over the player.
   > Circle collisions disabled for now
 * Base elements must have a **ref** named property with one of following values:
    * **301**: if it comes from players.
    * **101**/**201**: if it comes from environment.
 * Map elements of the **same aggro group** can not hit or be hitted between themselves.
 * Player hits increase aggro range.
 * There is a line of sight algoritm that helps avoid aggro.
