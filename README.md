# zenos

Building a 2D game engine from scratch using canvas and js for testing purposes.

```
It will be converted to a React application soon enough!
```

 * Player render
	- Start game with player skills from config options (json data)
	- Player direction and movement
	- Name, Life, Shoot, Shield and Speed
	- Game timer
	- Blinks when shoot or loses life
 * Map and map's elements render
	- Start full map from config options (json data)
	- Element fillings options (json data)
	- Element types with differents actions:
		+ Stop
		+ Reverse
		+ Disappear
		+ Takes damage or not (blinks when loses life)
	- Elements direction and movements (when applicable)
	- Map scrolling or fixed
 * Elements collisions
	- "Rectangle x Rectangle"
	- "Circle x Circle"
	- Right now, "Circle x Rectangle" or "Rectangle x Circle" acts as "Rectangle x Rectangle" collision
	- Configurable collisions actions
 * Elements iteration and Physics
 * Separated JS listeners for command iterations
