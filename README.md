# zenos

Building a 2D game engine from scratch using canvas and js for testing purposes.

```
It will be converted to a React application soon enough!
```

## Player entity

### Base features
 * Name, Life, Shoot, Shield and Speed.
 * Show current direction.
 * Can move, hit or be hitted (melee or ranged).
 * Blinks when shoot or loses life.

### Json element
 * **name**: Mandatory. The name of the player.
 * **life**: Mandatory. When it reaches zero game ends.
 * **damageTakenFactor**: Optional (default 50). It is like the armor, but the less the better.
   > Don't go above 50 or it will become less usefull
 * **timeBetweenHits**: Optional (default 450). It is the time between player hits.
   > In miliseconds
 * **type**: Mandatory. It is a number. Every element in the map has a type.
   > See more about element types below - we use type 3 for players (a type 3 can hit)
 * **radius**: Mandatory. Use always circle (radius) for players. It is the body hit box.
 * **x**: Mandatory. The current position in x axis. Coordinate x.
 * **y**: Mandatory. The current position in y axis. Coordinate y.
 * **currentDirection**: Optional. Must have for getting and drawning player looking direction.
   > See more about element directions below - we may use 1 for starting players in the map (East)
 * **style**: Defines the style of the player drawn - color of hitbox body and details.
   > Body receives the image when using images or sprites
 * **step**: Mandatory. Applicable for player's movement:
    * **x**: Moving speed at x axis.
    * **y**: Moving speed at y axis.
    * **increment**: The value used to increase or decrease the moving speed.
    * **xMax**: The maximum moving speed at x axis.
    * **yMax**: The maximum moving speed at y axis.
 * **hit**: Optional - zero bonus if not present. It is the **bonus damage** or the life gained to the target (if negative).
   > Only applicable if the origin element type **can hit** (player) and the target has a **life property**
 * **skills**: Are the player skills that can be used in the game:
    * **shield**:
        * **isShieldUpColor**: Optional (default lightcyan). The color of the skill when up.
        * **shieldReduceFactor**: Optional (default 2). The received damage reduction factor.
        * **charges**: Mandatory. How many charges the player have.
    * **shoot**:
        * **isShootingColor**: Optional (default lightcyan). The color of the skill when used.
        * **shootSpeed**: Optional (default 15). The shot speed in the map.
        * **charges**: Mandatory. How many charges the player have.
        * **baseElement**: Mandatory. It is an element (object) with type 9 and a bonus hit.

### Temporary json bindings at execution time
 * **_isShooting**: true when element is shooting.
 * **_isTakingDamage**: true when element is taking damage.
 * **_isShieldUp**: true when element shield is up.
 * **_isTimeBetweenHits**: must be lower than next hit time for a melee hit to be cast (miliseconds).
 * **_savedBody**: for blinking style body color of element (when taking damage).
 * **_savedDetails**: for blinking style details color of element (when shooting).

### Defaults only values
 * **elementTypesCanHit**: Array indicating which element types can hit (3, 5, 7, 9, 11).
 * **isTakingDamageColor**: The color of the element when taking damage (red).

## Map entity

### Base features
 * Its is the basic rectangle area where all elements of the game will exists.
 * Auto scrolling if the size of the map is bigger than screen.
 * Automatic async load all background images based on json data.
 * Personalized styles (backgrounds, borders, colors).

### Json element
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

### Json element
 * **id**: Mandatory. A number that specifies a unique identifier for the element.
 * **life**: Optional. If the element has a life property it can take hits and be destroyed.
   > If life property exists, when it reaches zero the element will disappear from the map
 * **damageTakenFactor**: Only applicable if element has a life property (default 50). It is like the armor, but the less the better.
   > Don't go above 50 or it will become less usefull
 * **timeBetweenHits**: Only applicable if element type can hit (default 450). It is the time between element hits.
   > In miliseconds
 * **type**: Mandatory. It is a number. Every element in the map has a type.
   > See more about element types below
 * **radius** or **width**/**height**: Mandatory exclusive. Radius for circles, Width/Height for rectangles. It is the body hit box.
 * **x**: Mandatory. The current position in x axis. Coordinate x.
 * **y**: Mandatory. The current position in y axis. Coordinate y.
 * **currentDirection**: Optional. Must have for getting and drawning element looking direction.
   > See more about element directions below - we may check element direction table when starting elements in the map (East)
 * **style**: Defines the style of the element drawn - color of hitbox body.
   > Body receives the image when using images or sprites
 * **step**: Only applicable if element can move:
    * **x**: Moving speed at x axis.
    * **y**: Moving speed at y axis.
    * **rangeLimit**: Optional. Defines boundaries limits in x and y axis for movement (if specified, at least one is mandatory):
      * **minX**: Minimum x coordinate accepted for movement, in normal conditions.
      * **maxX**: Maximum x coordinate accepted for movement, in normal conditions.
      * **minY**: Minimum y coordinate accepted for movement, in normal conditions.
      * **maxY**: Maximum y coordinate accepted for movement, in normal conditions.
 * **hit**: Optional - zero bonus if not present. It is the **bonus damage** or the life gained to the target (if negative).
   > Only applicable if the origin element type **can hit** and the target has a **life property**

### Temporary json bindings at execution time
 * **_isTakingDamage**: true when element is taking damage.
 * **_isTimeBetweenHits**: must be lower than next hit time for a melee hit to be cast (miliseconds).
 * **_savedBody**: for blinking style body color of element (when taking damage).

### Defaults only values
 * **elementTypesCanHit**: Array indicating which element types can hit (3, 5, 7, 9, 11).
 * **isTakingDamageColor**: The color of the element when taking damage (red).

## Element types
 * It is a number. Every element in the map has a type (including player).
 * Each type defines an action associated when collision happens in the game.
 * Odd type numbers means the element can hit and do damage or rise life.
 * The act of collision have an **origin element** and a **target element**.
 * Existing types:
  1. No collision, nothing happens
  2. Collision &#8594; action: persistent, origin keeps movement - can hit: no
  3. Collision &#8594; action: persistent, origin keeps movement - can hit: yes
  4. Collision &#8594; action: persistent, origin stops movement at the collided axis - can hit: no
  5. Collision &#8594; action: persistent, origin stops movement at the collided axis - can hit: yes
  6. Collision &#8594; action: persistent, origin reverts movement at the collided axis - can hit: no
  7. Collision &#8594; action: persistent, origin reverts movement at the collided axis - can hit: yes
  8. Collision &#8594; action: disappear on every collision (as origin or as target) - can hit: no
  9. Collision &#8594; action: disappear on every collision (as origin or as target) - can hit: yes
  10. Collision &#8594; action: disappear only if receives the collision (as target) - can hit: no
  11. Collision &#8594; action: disappear only if receives the collision (as target) - can hit: yes
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
 * "Rectangle x Rectangle".
   > Right now, "Circle x Rectangle" or "Rectangle x Circle" acts as "Rectangle x Rectangle" collision
 * Configurable collisions actions.
 * Elements iteration and Physics.
 * Separated JS listeners for command iterations.

##  Hit log screen
 * Shows hit logs in the game with some details like: hit value, hit bonus, damage taken factor and reduce factor.
