'use strict';

(function () {
	// -----------------------------------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------------------------------

	// Generic game helpers

	/*
		Temporary json bindings at execution time:
			_isShooting - true when element is shooting (if applicabble)
			_isTakingDamage - true when element is taking damage (if applicabble)
			_isShieldUp - true when element shield is up (if applicabble)
			_shieldBreakAmount - current counter for hits blocked until shield consumes one charge (if applicabble)
			_isTimeBetweenShieldUps - must be lower than next shield up delay for a new charge to be cast (does not exists for players)
			_isTimeBetweenHits - must be lower than next hit time for a melee hit to be cast
			_isTimeBetweenShootingHits - must be lower than next hit time for a ranged shooting hit to be cast (does not exists for players)
			_savedBody - for blinking style body color of element (when taking damage)
			_savedDetails - for blinking style details color of element (when shooting)
			_savedX - for map elements when getting aggro to save last step x value
			_savedY - for map elements when getting aggro to save last step y value
			_hitAmount - for map elements only when shooting: current counter for hit pause time checks
			_isAggroed - for map elements only that can be aggroed: true when element get aggroed by a player
	*/

	// Default values
	const defaults = {
		elementTypesCanHit: [3, 5, 7, 9, 11, 101, 201], // Element types that may produce damage or gain (hit possible)
		aggroRange: 200, // Range (in pixels) where a player can get aggroed by a map element
		damageTakenFactor: 50, // Only applicable if element has a life property - Lesser is more defense (default max 50)
		timeBetweenHits: 450, // In miliseconds, only applicable if element can hit
		hitPauseTimeCheck: [5, 6000], // Only for map elements that can shoot: [maxHitTrigger ,timeToWait] (timeToWait in miliseconds)
		isTakingDamageColor: 'red',
		isShootingColor: 'lightcyan',
		shootSpeed: 10,
		isShieldUpColor: 'lightcyan',
		shieldReduceFactor: 2,
		shieldBreakAmount: 5, // Max counter for hits blocked before consuming a shield charge
		shieldCap: 'rgba(239, 239, 239, 0.15)', // Shield background color
		timeBetweenShieldUps: 1500 // Only for map elements that can shield: delay time between charges for skill shield to be up again (miliseconds)
	};

	// Get random integer number (min and max included)
	const _randomIntFromInterval = (_min, _max) => (
		Math.floor((Math.random() * (_max - _min + 1)) + _min)
	);

	// Format number
	const _numberFormatted = (_number, _decimalsAfter = 0) => {
		const fatorDecimalsAfter = 10 ** _decimalsAfter;

		return (
			String((Math.round(_number * fatorDecimalsAfter) / fatorDecimalsAfter).toFixed(_decimalsAfter)).replace('.', ',')
		);
	};

	// Format timer
	const _timerFormatted = _number => {
		const date = new Date(0);

		date.setSeconds(_number);

		return (
			date.toISOString().substr(14, 5)
		);
	};

	// Generate stronger id (use it with max id from the map elements array)
	const _generateStrongId = lastFoundId => (
		lastFoundId + 1 + Math.floor(Math.random() * 1000)
	);

	// Find object key by its value (id) and replace with new value (first one found)
	const _objFindAndReplace = (_obj, _searchValue, _replaceValue) => {
		Object.keys(_obj).some(
			key => {
				const foundValue = _obj[key];

				if (foundValue !== null && typeof foundValue === 'object') {
					_objFindAndReplace(foundValue, _searchValue, _replaceValue);
				} else {
					if (_obj[key] === _searchValue) {
						_obj[key] = _replaceValue;

						return true;
					}
				}

				return false;
			}
		);
	};

	// Especific game helpers

	// Check if map border is close enough
	const _checkScreenBorders = _side => (
		_side / 2
	);

	// Get element current direction
	/*
		Return
			-11 -> NW
			-10 -> N
			-9 -> NE
			-1 -> W
			1 -> E
			9 -> SW
			10 -> S
			11 -> SE
	*/
	const _getElementDirection = _element => {
		let currentElementDirection = 0;

		const elementHasDirection = Object.prototype.hasOwnProperty.call(_element, 'currentDirection');

		if (elementHasDirection) { // Only makes sense if element has a side direction
			if (_element.step) {
				if (_element.step.x === 0 && _element.step.y === 0) {
					currentElementDirection = _element.currentDirection;
				} else {
					let saveThis = false;

					if (_element.step.x > 0) {
						currentElementDirection += 1;
						saveThis = true;
					} else if (_element.step.x < 0) {
						currentElementDirection -= 1;
						saveThis = true;
					}

					if (_element.step.y > 0) {
						currentElementDirection += 10;
						saveThis = true;
					} else if (_element.step.y < 0) {
						currentElementDirection -= 10;
						saveThis = true;
					}

					if (saveThis) {
						_element.currentDirection = currentElementDirection; // Saves the number but function output is the related string (easier to read)
					}
				}
			} else {
				currentElementDirection = _element.currentDirection;
			}
		}

		switch (currentElementDirection) {
			case -11: { // North West
				return 'NW';
			}
			case -10: { // North
				return 'N';
			}
			case -9: { // North East
				return 'NE';
			}
			case -1: { // West
				return 'W';
			}
			case 1: { // East
				return 'E';
			}
			case 9: { // South West
				return 'SW';
			}
			case 10: { // South
				return 'S';
			}
			case 11: { // South East
				return 'SE';
			}
			default: {
				return '';
			}
		}
	};

	// Drawn element body and direction (if applicable)
	const _drawnElement = (_cx, _element, _currentElementDirection) => {
		const elementIsACircle = _element.radius || false;

		// Drawn element body
		if (elementIsACircle) {
			const elementStyle = _element.style;

			_cx.save();

			_cx.beginPath();
			_cx.arc(_element.x, _element.y, _element.radius, 0, 2 * Math.PI);
			_cx.fillStyle = elementStyle.color.body;
			_cx.fill();
			_cx.closePath();

			if (elementStyle.border) {
				_cx.lineWidth = elementStyle.border.width;
				_cx.strokeStyle = elementStyle.border.color;
				_cx.stroke();
			}

			_cx.restore();
		} else {
			const elementStyle = _element.style;

			_cx.save();

			if (_element.rotate) {
				_cx.translate(_element.x, _element.y);
				_cx.rotate(_element.rotate * Math.PI / 180);
				_cx.translate(-_element.x, -_element.y);
			}

			_cx.fillStyle = elementStyle.color.body;
			_cx.fillRect(_element.x, _element.y, _element.width, _element.height);

			if (elementStyle.border) {
				_cx.lineWidth = elementStyle.border.width;
				_cx.strokeStyle = elementStyle.border.color;
				_cx.strokeRect(_element.x, _element.y, _element.width, _element.height);
			}

			_cx.restore();
		}

		// Drawn element direction
		const elementHasDirection = Object.prototype.hasOwnProperty.call(_element, 'currentDirection');

		if (elementHasDirection) { // Only makes sense if element has a side direction
			const _drawnElementDirection = (_cx, _element, _elementIsACircle, _getX, _getY) => {
				_cx.save();

				_cx.lineWidth = 5;

				const baseInnerRectStart = _cx.lineWidth / 2;

				_cx.beginPath();

				if (_elementIsACircle) {
					_cx.rect(_element.x - baseInnerRectStart, _element.y - baseInnerRectStart, _cx.lineWidth, _cx.lineWidth);
					_cx.moveTo(_element.x, _element.y);
				} else {
					const midInnerRectWidth = _element.x + (_element.width / 2);
					const midInnerRectHeight = _element.y + (_element.height / 2);

					_cx.rect(midInnerRectWidth - baseInnerRectStart, midInnerRectHeight - baseInnerRectStart, _cx.lineWidth, _cx.lineWidth);
					_cx.moveTo(midInnerRectWidth, midInnerRectHeight);
				}

				_cx.lineTo(_getX, _getY);
				_cx.strokeStyle = _element.style.color.details;
				_cx.stroke();
				_cx.closePath();

				_cx.restore();
			};

			const baseAngle = Math.PI / 180;

			switch (_currentElementDirection) {
				case 'NW': {
					if (elementIsACircle) {
						const getX = _element.x + (_element.radius * Math.sin(-45 * baseAngle));
						const getY = _element.y - (_element.radius * Math.cos(-45 * baseAngle));

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					} else {
						const getX = _element.x;
						const getY = _element.y;

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					}

					break;
				}
				case 'N': {
					if (elementIsACircle) {
						const getX = _element.x;
						const getY = _element.y - _element.radius;

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					} else {
						const getX = _element.x + (_element.width / 2);
						const getY = _element.y;

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					}

					break;
				}
				case 'NE': {
					if (elementIsACircle) {
						const getX = _element.x + (_element.radius * Math.sin(45 * baseAngle));
						const getY = _element.y - (_element.radius * Math.cos(45 * baseAngle));

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					} else {
						const getX = _element.x + _element.width;
						const getY = _element.y;

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					}

					break;
				}
				case 'W': {
					if (elementIsACircle) {
						const getX = _element.x - _element.radius;
						const getY = _element.y;

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					} else {
						const getX = _element.x;
						const getY = _element.y + (_element.height / 2);

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					}

					break;
				}
				case 'E': {
					if (elementIsACircle) {
						const getX = _element.x + _element.radius;
						const getY = _element.y;

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					} else {
						const getX = _element.x + _element.width;
						const getY = _element.y + (_element.height / 2);

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					}

					break;
				}
				case 'SW': {
					if (elementIsACircle) {
						const getX = _element.x + (_element.radius * Math.sin(225 * baseAngle));
						const getY = _element.y - (_element.radius * Math.cos(225 * baseAngle));

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					} else {
						const getX = _element.x;
						const getY = _element.y + _element.height;

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					}

					break;
				}
				case 'S': {
					if (elementIsACircle) {
						const getX = _element.x;
						const getY = _element.y + _element.radius;

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					} else {
						const getX = _element.x + (_element.width / 2);
						const getY = _element.y + _element.height;

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					}

					break;
				}
				case 'SE': {
					if (elementIsACircle) {
						const getX = _element.x + (_element.radius * Math.sin(-225 * baseAngle));
						const getY = _element.y - (_element.radius * Math.cos(-225 * baseAngle));

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					} else {
						const getX = _element.x + _element.width;
						const getY = _element.y + _element.height;

						_drawnElementDirection(_cx, _element, elementIsACircle, getX, getY);
					}

					break;
				}
			}
		}
	};

	const _drawnElementShield = (_cx, _elementShielded) => {
		const elementShieldedX = _elementShielded.radius ? _elementShielded.x : _elementShielded.x + (_elementShielded.width / 2);
		const elementShieldedY = _elementShielded.radius ? _elementShielded.y : _elementShielded.y + (_elementShielded.height / 2);
		const shieldSize = (_elementShielded.radius || (_elementShielded.width / 2)) * 1.5;

		_cx.save();

		_cx.fillStyle = defaults.shieldCap;
		_cx.lineWidth = 1;

		_cx.beginPath();
		_cx.arc(elementShieldedX, elementShieldedY, shieldSize, 0, 2 * Math.PI);
		_cx.strokeStyle = (_elementShielded.skills.shield.isShieldUpColor || defaults.isShieldUpColor);
		_cx.stroke();
		_cx.fill();
		_cx.closePath();

		_cx.restore();
	};

	// Drawns element shots (works better with circle and square elements)
	// Shot drawning is always in circle format (for performance)
	const _drawnElementShot = (elementShooting, _map, _newShootDataBaseElement, _newShootDataSpeed) => {
		const currentElementDirection = _getElementDirection(elementShooting);

		const checkDirectionXpositive = ['NE', 'E', 'SE'].includes(currentElementDirection);
		const checkDirectionXnegative = ['NW', 'W', 'SW'].includes(currentElementDirection);
		const checkDirectionYpositive = ['SW', 'S', 'SE'].includes(currentElementDirection);
		const checkDirectionYnegative = ['NW', 'N', 'NE'].includes(currentElementDirection);

		const newShootBaseValue = _newShootDataBaseElement.radius ? _newShootDataBaseElement.radius : (_newShootDataBaseElement.width / 2);

		const secureCollisionValue = (
			elementShooting.radius ? (
				elementShooting.radius + newShootBaseValue
			) : (
				elementShooting.width >= elementShooting.height ? (
					(elementShooting.width / 2) + newShootBaseValue
				) : (
					(elementShooting.height / 2) + newShootBaseValue
				)
			)
		);

		const getElementX = (
			elementShooting.radius ? (
				elementShooting.x
			) : (
				elementShooting.x + (elementShooting.width / 2)
			)
		);

		const getElementY = (
			elementShooting.radius ? (
				elementShooting.y
			) : (
				elementShooting.y + (elementShooting.height / 2)
			)
		);

		const shootDataX = checkDirectionXpositive ? (
			getElementX + secureCollisionValue
		) : (
			checkDirectionXnegative ? (
				getElementX - secureCollisionValue
			) : (
				getElementX
			)
		);

		const shootDataY = checkDirectionYpositive ? (
			getElementY + secureCollisionValue
		) : (
			checkDirectionYnegative ? (
				getElementY - secureCollisionValue
			) : (
				getElementY
			)
		);

		const shootCheckingStepX = elementShooting.step && elementShooting.step.x;
		const shootCheckingStepY = elementShooting.step && elementShooting.step.y;
		const shootSpeed = (_newShootDataSpeed || defaults.shootSpeed);

		const shootStepX = (shootCheckingStepX > 0 || checkDirectionXpositive) ? (
			shootSpeed
		) : (
			(shootCheckingStepX < 0 || checkDirectionXnegative) ? (
				shootSpeed * -1
			) : (
				0
			)
		);

		const shootStepY = (shootCheckingStepY > 0 || checkDirectionYpositive) ? (
			shootSpeed
		) : (
			(shootCheckingStepY < 0 || checkDirectionYnegative) ? (
				shootSpeed * -1
			) : (
				0
			)
		);

		const shootDataId = _map.elements.reduce(
			(maxId, element) => (element.id > maxId ? element.id : maxId),
			0
		);

		const newShootDataAttach = {
			id: _generateStrongId(shootDataId),
			x: shootDataX,
			y: shootDataY,
			step: {
				x: shootStepX,
				y: shootStepY
			}
		};

		_map.elements.push({ ..._newShootDataBaseElement, ...newShootDataAttach });
	};

	// -----------------------------------------------------------------------------------------------
	// Listeners (load / start)
	// -----------------------------------------------------------------------------------------------

	const listeners = {
		keyDownHandlerBeginGame: (_event, _player, _map) => {
			_event.preventDefault();

			// Movements / actions -> shield (q) / space / arrow up / arrow down/ arrow left / arrow right
			const _beginGame = () => {
				switch (_event.key) {
					case 'q':
					case 'Q': {
						const shieldData = (_player.skills && _player.skills.shield);

						if (shieldData) {
							if (!_player._isShieldUp && shieldData.charges > 0) {
								_player._isShieldUp = true;
							} else {
								_player._isShieldUp = false;
							}
						}

						break;
					}
					case 'w':
					case 'W': {
						const newShootData = _player.skills && _player.skills.weapon && _player.skills.weapon.shoot;

						if (newShootData) {
							const chekInfiniteAmmo = newShootData.charges === -1;
							const chargesLeft = !chekInfiniteAmmo && newShootData.charges;

							if (chekInfiniteAmmo || chargesLeft > 0) {
								const newShootDataBaseElement = { ...newShootData.baseElement };
								const newShootDataSpeed = newShootData.shootSpeed;

								_drawnElementShot(_player, _map, newShootDataBaseElement, newShootDataSpeed);

								_player._isShooting = true;

								if (!chekInfiniteAmmo) {
									newShootData.charges -= 1;
								}
							}
						}

						break;
					}
					case ' ': {
						if (_player.step.x !== 0) {
							_player.step.x = 0;
						}

						if (_player.step.y !== 0) {
							_player.step.y = 0;
						}

						break;
					}
					case 'up':
					case 'ArrowUp': {
						if (_player.step.y < 0) {
							_player.step.x = 0;
						} else {
							if (_player.step.x !== 0) {
								if (_player.step.x > 0) {
									_player.step.x = _player.step.increment;
								} else {
									_player.step.x = -_player.step.increment;
								}
							}
						}

						if (_player.step.y <= 0) {
							if (Math.abs(_player.step.y) < _player.step.yMax) {
								_player.step.y -= _player.step.increment;
							}
						} else {
							_player.step.y += -_player.step.increment;
						}

						break;
					}
					case 'down':
					case 'ArrowDown': {
						if (_player.step.y > 0) {
							_player.step.x = 0;
						} else {
							if (_player.step.x !== 0) {
								if (_player.step.x > 0) {
									_player.step.x = _player.step.increment;
								} else {
									_player.step.x = -_player.step.increment;
								}
							}
						}

						if (_player.step.y >= 0) {
							if (Math.abs(_player.step.y) < _player.step.yMax) {
								_player.step.y += _player.step.increment;
							}
						} else {
							_player.step.y -= -_player.step.increment;
						}

						break;
					}
					case 'left':
					case 'ArrowLeft': {
						if (_player.step.x < 0) {
							_player.step.y = 0;
						} else {
							if (_player.step.y !== 0) {
								if (_player.step.y > 0) {
									_player.step.y = _player.step.increment;
								} else {
									_player.step.y = -_player.step.increment;
								}
							}
						}

						if (_player.step.x <= 0) {
							if (Math.abs(_player.step.x) < _player.step.xMax) {
								_player.step.x -= _player.step.increment;
							}
						} else {
							_player.step.x += -_player.step.increment;
						}

						break;
					}
					case 'right':
					case 'ArrowRight': {
						if (_player.step.x > 0) {
							_player.step.y = 0;
						} else {
							if (_player.step.y !== 0) {
								if (_player.step.y > 0) {
									_player.step.y = _player.step.increment;
								} else {
									_player.step.y = -_player.step.increment;
								}
							}
						}

						if (_player.step.x >= 0) {
							if (Math.abs(_player.step.x) < _player.step.xMax) {
								_player.step.x += _player.step.increment;
							}
						} else {
							_player.step.x -= -_player.step.increment;
						}

						break;
					}
				}

				// Update menu screen
				setMenuScreen(_player, _map);
			};

			if (!_event.repeat) {
				_beginGame();
			}
		},
		keyPressHandlerRestartGame: _event => {
			_event.preventDefault();

			// Restart game
			switch (_event.key) {
				case 'Enter': {
					restartGame();
				}
			}
		}
	};

	// -----------------------------------------------------------------------------------------------
	// Map
	// -----------------------------------------------------------------------------------------------

	// Shield action (if applicable)
	const elementActionShield = _mapElement => {
		const shieldData = _mapElement.skills && _mapElement.skills.shield;

		if (shieldData) {
			if (_mapElement._isShieldUp === undefined) { // Start shield
				_mapElement._isShieldUp = true;
			} else {
				if (shieldData.charges > 0) {
					const currentShieldUpTimeCheck = Date.now();

					if (_mapElement._isShieldUp) {
						_mapElement._isTimeBetweenShieldUps = currentShieldUpTimeCheck + defaults.timeBetweenShieldUps;
					} else {
						if (currentShieldUpTimeCheck > _mapElement._isTimeBetweenShieldUps) {
							_mapElement._isShieldUp = true;
						}
					}
				}
			}
		}
	};

	// Shooting action (if applicable)
	const elementActionShot = (_mapElement, _map) => {
		const newShootData = (_mapElement.skills && _mapElement.skills.weapon && _mapElement.skills.weapon.shoot);

		if (newShootData) {
			const currentHitTimeCheck = Date.now();

			if (!_mapElement._isTimeBetweenShootingHits || currentHitTimeCheck > _mapElement._isTimeBetweenShootingHits) {
				const chekInfiniteAmmo = newShootData.charges === -1;
				const chargesLeft = !chekInfiniteAmmo && newShootData.charges;

				if (chekInfiniteAmmo || chargesLeft > 0) {
					const newShootDataBaseElement = { ...newShootData.baseElement };
					const newShootDataSpeed = newShootData.shootSpeed;

					_drawnElementShot(_mapElement, _map, newShootDataBaseElement, newShootDataSpeed);

					_mapElement._isShooting = true;

					if (!chekInfiniteAmmo) {
						newShootData.charges -= 1;
						_mapElement._hitAmount = (_mapElement._hitAmount || 0) + 1; // For hitting pause checks
					}
				}

				const [maxHitTrigger, timeToWait] = (_mapElement.hitPauseTimeCheck || defaults.hitPauseTimeCheck); // For hitting pause checks

				const hittingPause = (
					_mapElement._hitAmount % maxHitTrigger === 0 ? (
						timeToWait
					) : (
						0
					)
				);

				_mapElement._isTimeBetweenShootingHits = currentHitTimeCheck + (_mapElement.timeBetweenHits || defaults.timeBetweenHits) + hittingPause;
			}
		}
	};

	// Shield action (if applicable)
	const elementActionShieldRemove = _mapElement => {
		const shieldData = _mapElement.skills && _mapElement.skills.shield;

		if (shieldData && _mapElement._isShieldUp) {
			_mapElement._isShieldUp = false;
		}
	};

	// Execute element actions (if applicable)
	const elementActions = (_mapElement, _map, _playerHasAggro) => {
		if (_playerHasAggro) {
			// Check shield action
			elementActionShield(_mapElement);

			// Check shooting action
			elementActionShot(_mapElement, _map);
		} else {
			// Check shield action
			elementActionShieldRemove(_mapElement);
		}
	};

	// Check step range limits (if applicable)
	const moveMapElementRangeLimit = (_mapElement, _playerHasAggro) => {
		if (!_playerHasAggro && _mapElement.step.rangeLimit) {
			const rangeLimit = _mapElement.step.rangeLimit;

			const speedStepX = _mapElement.step.x || 0;
			const speedStepY = _mapElement.step.y || 0;

			const checkMapElementX = (
				_mapElement.radius ? _mapElement.x : _mapElement.x + (_mapElement.width / 2)
			);

			const checkMapElementY = (
				_mapElement.radius ? _mapElement.y : _mapElement.y + (_mapElement.height / 2)
			);

			if (speedStepX !== 0) {
				if ((speedStepX < 0 && checkMapElementX < (rangeLimit.minX || 0)) || (speedStepX > 0 && checkMapElementX > (rangeLimit.maxX || $boxWidth))) {
					_mapElement.step.x = -_mapElement.step.x;
				}
			}

			if (speedStepY !== 0) {
				if ((speedStepY < 0 && checkMapElementY < (rangeLimit.minY || 0)) || (speedStepY > 0 && checkMapElementY > (rangeLimit.maxY || $boxHeight))) {
					_mapElement.step.y = -_mapElement.step.y;
				}
			}
		}
	};

	// Check if player got aggroed and move accordly (if applicable)
	const moveMapElementPlayerAggro = (_mapElement, _mapElements, _player) => {
		let playerHasAggro = false;

		// If aggroRange equals -1 or element has no life: no aggro permitted for the element
		if (_mapElement.aggroRange !== -1 && _mapElement.life && _mapElement.life > 0) {
			const aggroGroupCheck = (
				_mapElements
				.filter(
					element => _mapElement.aggroGroup && element.id !== _mapElement.id && element.aggroGroup === _mapElement.aggroGroup
				)
				.some(
					element => element._isAggroed
				)
			);

			const aggroPlayer = ((_player.x - _mapElement.x) ** 2) + ((_player.y - _mapElement.y) ** 2);
			const aggroRange = (_mapElement.aggroRange || defaults.aggroRange) ** 2;
			const aggroCheck = aggroPlayer <= aggroRange;

			if (aggroGroupCheck || aggroCheck) {
				if (!aggroGroupCheck) {
					_mapElement._isAggroed = true;
				}

				if (!_mapElement.step._savedX && _mapElement.step._savedX !== 0) {
					_mapElement.step._savedX = _mapElement.step.x; // Temporary
				}

				if (!_mapElement.step._savedY && _mapElement.step._savedY !== 0) {
					_mapElement.step._savedY = _mapElement.step.y; // Temporary
				}

				const speedStepX = _mapElement.step.x || 0;
				const speedStepY = _mapElement.step.y || 0;

				const checkMapElementX = (
					_mapElement.radius ? _mapElement.x : _mapElement.x + (_mapElement.width / 2)
				);

				const checkMapElementY = (
					_mapElement.radius ? _mapElement.y : _mapElement.y + (_mapElement.height / 2)
				);

				const secureNearAggroValue = (_player.radius || (_player.width / 2));

				const validateAggroX = (_player.x > checkMapElementX + secureNearAggroValue) || (_player.x < checkMapElementX - secureNearAggroValue);
				const validateAggroY = (_player.y > checkMapElementY + secureNearAggroValue) || (_player.y < checkMapElementY - secureNearAggroValue);

				if (speedStepX !== 0) {
					if (validateAggroX) {
						if ((speedStepX < 0 && checkMapElementX < _player.x) || (speedStepX > 0 && checkMapElementX > _player.x)) {
							_mapElement.step.x = -_mapElement.step.x;
						}
					} else {
						_mapElement.step.x = 0;
					}
				} else {
					if (validateAggroX) {
						if (_player.step.x !== 0) {
							if (!_mapElement.radius || !_player.radius) {
								_mapElement.step.x = -_player.step.x;
							} else { // Circle x Circle
								if (_player.step.x < 0) {
									if (_mapElement.x - _mapElement.radius >= _player.x + _player.radius) {
										_mapElement.step.x = -_player.step.x;
									}
								} else {
									if (_mapElement.x + _mapElement.radius <= _player.x - _player.radius) {
										_mapElement.step.x = -_player.step.x;
									}
								}
							}
						} else {
							_mapElement.step.x = (_mapElement.x > _player.x ? -1 : 1);
						}
					}
				}

				if (speedStepY !== 0) {
					if (validateAggroY) {
						if ((speedStepY < 0 && checkMapElementY < _player.y) || (speedStepY > 0 && checkMapElementY > _player.y)) {
							_mapElement.step.y = -_mapElement.step.y;
						}
					} else {
						_mapElement.step.y = 0;
					}
				} else {
					if (validateAggroY) {
						if (_player.step.y !== 0) {
							if (!_mapElement.radius || !_player.radius) {
								_mapElement.step.y = -_player.step.y;
							} else { // Circle x Circle
								if (_player.step.y < 0) {
									if (_mapElement.y - _mapElement.radius >= _player.y + _player.radius) {
										_mapElement.step.y = -_player.step.y;
									}
								} else {
									if (_mapElement.y + _mapElement.radius <= _player.y - _player.radius) {
										_mapElement.step.y = -_player.step.y;
									}
								}
							}
						} else {
							_mapElement.step.y = (_mapElement.y > _player.y ? -1 : 1);
						}
					}
				}

				playerHasAggro = true;
			} else {
				_mapElement._isAggroed = false;

				if (_mapElement.step._savedX || _mapElement.step._savedX === 0) {
					_mapElement.step.x = _mapElement.step._savedX;
					delete _mapElement.step._savedX;
				}

				if (_mapElement.step._savedY || _mapElement.step._savedY === 0) {
					_mapElement.step.y = _mapElement.step._savedY;
					delete _mapElement.step._savedY;
				}
			}
		}

		return playerHasAggro;
	};

	const moveMapElement = (_mapElement, _mapElements, _player) => {
		if (_mapElement.step) {
			const playerHasAggro = moveMapElementPlayerAggro(_mapElement, _mapElements, _player);

			if (_mapElement.type !== 101) { // Type 101 defines the platform mode. Element map has a direction but can not move
				moveMapElementRangeLimit(_mapElement, playerHasAggro);

				if (_mapElement.step.x) {
					if (_mapElement.step.x !== 0) {
						_mapElement.x += _mapElement.step.x;
					}
				}

				if (_mapElement.step.y) {
					if (_mapElement.step.y !== 0) {
						_mapElement.y += _mapElement.step.y;
					}
				}
			}

			return playerHasAggro;
		}

		return false;
	};

	const drawMapElements = (_cx, _player, _map) => {
		const _drawnElementDetails = (_cx, _mapElement) => {
			const mapElementStyleColor = _mapElement.style && _mapElement.style.color;

			// Takes damage
			if (_mapElement._isTakingDamage) {
				mapElementStyleColor.body = defaults.isTakingDamageColor;
				_mapElement._isTakingDamage = false;
			} else {
				if (!mapElementStyleColor._savedBody) {
					mapElementStyleColor._savedBody = mapElementStyleColor.body; // Temporary
				}

				mapElementStyleColor.body = mapElementStyleColor._savedBody;
			}

			// Weapon shoot
			if (_mapElement._isShooting) {
				mapElementStyleColor.details = (_mapElement.skills.weapon.shoot.isShootingColor || defaults.isShootingColor);
				_mapElement._isShooting = false;
			} else {
				if (!mapElementStyleColor._savedDetails) {
					mapElementStyleColor._savedDetails = mapElementStyleColor.details; // Temporary
				}

				mapElementStyleColor.details = mapElementStyleColor._savedDetails;
			}

			// Shield
			if (_mapElement._isShieldUp && _mapElement.skills.shield.charges > 0) {
				_drawnElementShield(_cx, _mapElement);
			}
		};

		const mapElements = _map.elements;

		// Elements for base screen
		for (const mapElement of mapElements) {
			// Remove life zero or less elements
			const elementHasLife = Object.prototype.hasOwnProperty.call(mapElement, 'life');

			if (elementHasLife && mapElement.life <= 0) {
				const itemToRemove = mapElements.findIndex(item => mapElement.id && item.id === mapElement.id);

				if (itemToRemove !== -1) {
					mapElements.splice(itemToRemove, 1);
				}
			} else {
				// Movement (if applicable)
				const playerHasAggro = moveMapElement(mapElement, mapElements, _player);

				// Collisions
				checkElementCollisions(mapElement, _player, _map);

				// Element direction (if applicable)
				const currentElementDirection = _getElementDirection(mapElement);

				// Drawn element body (direction if applicable)
				_drawnElement(_cx, mapElement, currentElementDirection);

				// Drawn element details (shield, damage, ...)
				_drawnElementDetails(_cx, mapElement);

				// Execute element actions (if applicable)
				elementActions(mapElement, _map, playerHasAggro);
			}
		}
	};

	const renderMap = (_cx, _player, _map) => {
		_cx.save();

		// Drawn base screen Filling
		_cx.fillStyle = _map.style.fillStyle;
		_cx.fillRect(0, 0, $boxWidth, $boxHeight);

		// Drawn base screen Borders
		_cx.lineWidth = _map.baseLineWidth * 2; // Linewidth is half a pixel

		_cx.beginPath();
		_cx.rect(0, 0, $boxWidth, $boxHeight);
		_cx.strokeStyle = _map.style.outline;
		_cx.stroke();
		_cx.closePath();

		_cx.restore();

		// Elements inside base screen
		drawMapElements(_cx, _player, _map);
	};

	// -----------------------------------------------------------------------------------------------
	// Player
	// -----------------------------------------------------------------------------------------------

	const movePlayer = (_action, _player) => {
		if (_player.step) {
			if (_player.step.x) {
				if (_player.step.x !== 0) {
					const speedStepX = _player.step.x;

					if ($boxWidth > _action.offsetWidth) {
						const screenCheckW = _checkScreenBorders(_action.offsetWidth);

						if (speedStepX > 0) {
							if (_player.x <= $boxWidth) {
								if (_player.x + screenCheckW + speedStepX >= _action.offsetWidth && _player.x - speedStepX <= $boxWidth - screenCheckW) {
									_action.scrollLeft += speedStepX;
								}
							}
						} else {
							if (_player.x >= 0) {
								if (_player.x + screenCheckW + speedStepX <= $boxWidth && _player.x - speedStepX >= screenCheckW) {
									_action.scrollLeft += speedStepX;
								}
							}
						}
					}

					_player.x += speedStepX;
				}
			}

			if (_player.step.y) {
				if (_player.step.y !== 0) {
					const speedStepY = _player.step.y;

					if ($boxHeight > _action.offsetHeight) {
						const screenCheckY = _checkScreenBorders(_action.offsetHeight);

						if (speedStepY > 0) {
							if (_player.y <= $boxHeight) {
								if (_player.y + screenCheckY + speedStepY >= _action.offsetHeight && _player.y - speedStepY <= $boxHeight - screenCheckY) {
									_action.scrollTop += speedStepY;
								}
							}
						} else {
							if (_player.y >= 0) {
								if (_player.y + screenCheckY + speedStepY <= $boxHeight && _player.y - speedStepY >= screenCheckY) {
									_action.scrollTop += speedStepY;
								}
							}
						}
					}

					_player.y += speedStepY;
				}
			}
		}
	};

	const renderPlayer = (_action, _cx, _player, _map) => {
		const _drawnPlayerDetails = (_cx, _player) => {
			const playerStyleColor = _player.style && _player.style.color;

			// Takes damage
			if (_player._isTakingDamage) {
				playerStyleColor.body = defaults.isTakingDamageColor;
				_player._isTakingDamage = false;
			} else {
				if (!playerStyleColor._savedBody) {
					playerStyleColor._savedBody = playerStyleColor.body; // Temporary
				}

				playerStyleColor.body = playerStyleColor._savedBody;
			}

			// Weapon shoot
			if (_player._isShooting) {
				playerStyleColor.details = (_player.skills.weapon.shoot.isShootingColor || defaults.isShootingColor);
				_player._isShooting = false;
			} else {
				if (!playerStyleColor._savedDetails) {
					playerStyleColor._savedDetails = playerStyleColor.details; // Temporary
				}

				playerStyleColor.details = playerStyleColor._savedDetails;
			}

			// Shield
			if (_player._isShieldUp && _player.skills.shield.charges > 0) {
				_drawnElementShield(_cx, _player);
			}
		};

		// Movement
		movePlayer(_action, _player);

		// Collisions
		checkPlayerCollisions(_player, _map);

		// Player direction
		const currentPlayerDirection = _getElementDirection(_player);

		// Drawn player body and direction
		_drawnElement(_cx, _player, currentPlayerDirection);

		// Drawn player details (shield, damage, ...)
		_drawnPlayerDetails(_cx, _player);
	};

	// -----------------------------------------------------------------------------------------------
	// Collisions
	// -----------------------------------------------------------------------------------------------
	const collisionAvoidPenetration = (_checkElement, _mapElement, _phase) => {
		const _getAidValues = (_checkElement, _mapElement) => { // Values to avoid penetration inside the _mapElement (target)
			const aidValues = {};

			const mapRadius2CirclesDistanceX = (
				_checkElement.radius && _mapElement.radius && (
					Math.sqrt(((_checkElement.radius + _mapElement.radius) ** 2) - ((_checkElement.y - _mapElement.y) ** 2))
				)
			) || 0;

			const mapRadius2CirclesDistanceY = (
				_checkElement.radius && _mapElement.radius && (
					Math.sqrt(((_checkElement.radius + _mapElement.radius) ** 2) - ((_checkElement.x - _mapElement.x) ** 2))
				)
			) || 0;

			const mapRadiusReflexionX = (
				mapRadius2CirclesDistanceX ? ( // Only circle x circle
					mapRadius2CirclesDistanceX - _checkElement.radius
				) : (
					_mapElement.radius
				)
			);

			const mapRadiusReflexionY = (
				mapRadius2CirclesDistanceY ? ( // Only circle x circle
					mapRadius2CirclesDistanceY - _checkElement.radius
				) : (
					_mapElement.radius
				)
			);

			aidValues.baseCheckElementDistanceX = _checkElement.radius ? _checkElement.radius : (_checkElement.step.x > 0 ? _checkElement.width : 0);
			aidValues.baseCheckElementDistanceY = _checkElement.radius ? _checkElement.radius : (_checkElement.step.y > 0 ? _checkElement.height : 0);
			aidValues.baseMapElementDistanceX = _mapElement.radius ? mapRadiusReflexionX : (_checkElement.step.x > 0 ? 0 : _mapElement.width);
			aidValues.baseMapElementDistanceY = _mapElement.radius ? mapRadiusReflexionY : (_checkElement.step.y > 0 ? 0 : _mapElement.height);

			return aidValues;
		};

		const aidValues = _getAidValues(_checkElement, _mapElement);

		if (_checkElement.step.x !== 0 && [1, 2].includes(_phase)) {
			const adjustPenetrationX = (
				Math.abs(_checkElement.x - _mapElement.x + _checkElement.step.x) < Math.abs(_checkElement.x - _mapElement.x)
			);

			if (_phase === 1 && _checkElement.step.x < 0) {
				if (adjustPenetrationX) {
					_checkElement.x = _mapElement.x + aidValues.baseCheckElementDistanceX + aidValues.baseMapElementDistanceX;
					return _phase;
				}
			} else if (_phase === 2 && _checkElement.step.x > 0) {
				if (adjustPenetrationX) {
					_checkElement.x = _mapElement.x - aidValues.baseCheckElementDistanceX - aidValues.baseMapElementDistanceX;
					return _phase;
				}
			}
		} else if (_checkElement.step.y !== 0 && [3, 4].includes(_phase)) {
			const adjustPenetrationY = (
				Math.abs(_checkElement.y - _mapElement.y + _checkElement.step.y) < Math.abs(_checkElement.y - _mapElement.y)
			);

			if (_phase === 3 && _checkElement.step.y < 0) {
				if (adjustPenetrationY) {
					_checkElement.y = _mapElement.y + aidValues.baseCheckElementDistanceY + aidValues.baseMapElementDistanceY;
					return _phase;
				}
			} else if (_phase === 4 && _checkElement.step.y > 0) {
				if (adjustPenetrationY) {
					_checkElement.y = _mapElement.y - aidValues.baseCheckElementDistanceY - aidValues.baseMapElementDistanceY;
					return _phase;
				}
			}
		}

		return -1;
	};

	// Execute collision actions
	const collisionActions = (_checkElement, _mapElement, _mapElements, phase) => {
		/*
		Validation at origin element (type)
		*/
		switch (_checkElement.type) {
			/*
			Origin element disappear (destroyed)
			*/
			case 8:
			case 9: { // Both elements removed from map - origin and target
				const itemToRemove = _mapElements.findIndex(item => _checkElement.id && item.id === _checkElement.id);

				if (itemToRemove !== -1) {
					_mapElements.splice(itemToRemove, 1);
				}

				break;
			}
		}

		/*
		Validation at target element (type)
		*/
		switch (_mapElement.type) {
			/*
			No penetration in target element
			*/
			case 2:
			case 3: // Keep origin movement
			case 101: // Platform mode - keep origin movement (stacked in place)
			case 201: // Mob type - keep origin movement (only for mobs)
			case 4:
			case 5: // Stop origin movement
			case 6:
			case 7: { // Revert origin movement
				// ------------------------------------------------------------
				// Effect actions
				const _executeActionX = (_checkElement, _mapElement) => {
					switch (_mapElement.type) {
						case 4:
						case 5: {
							_checkElement.step.x = 0;
							break;
						}
						case 6:
						case 7: {
							_checkElement.step.x = -_checkElement.step.x;
							break;
						}
					}
				};

				const _executeActionY = (_checkElement, _mapElement) => {
					switch (_mapElement.type) {
						case 4:
						case 5: {
							_checkElement.step.y = 0;
							break;
						}
						case 6:
						case 7: {
							_checkElement.step.y = -_checkElement.step.y;
							break;
						}
					}
				};
				// ------------------------------------------------------------

				const executeActions = collisionAvoidPenetration(_checkElement, _mapElement, phase);

				switch (executeActions) {
					case 1:
					case 2: { // Actions at x axis
						_executeActionX(_checkElement, _mapElement);
						break;
					}
					case 3:
					case 4: { // Actions at y axis
						_executeActionY(_checkElement, _mapElement);
						break;
					}
				}

				break;
			}
			/*
			Target element disappear (destroyed)
			*/
			case 8:
			case 9: // Both elements removed from map - origin and target
			case 10:
			case 11: { // Target element removed from map
				const itemToRemove = _mapElements.findIndex(item => _mapElement.id && item.id === _mapElement.id);

				if (itemToRemove !== -1) {
					_mapElements.splice(itemToRemove, 1);
				}

				break;
			}
		}

		const mayModifyElementsLifes = (
			defaults.elementTypesCanHit.includes(_mapElement.type) || defaults.elementTypesCanHit.includes(_checkElement.type)
		);

		return mayModifyElementsLifes;
	};

	const checkMapBorderXCollision = (checkElement, _map) => {
		if (checkElement.step.x !== 0) {
			const baseCheckElementDistanceX = checkElement.radius ? checkElement.radius : 0;
			const baseCheckElementDistanceY = checkElement.radius ? checkElement.radius : checkElement.width;

			const primaryBaseDistanceWidth = baseCheckElementDistanceX + _map.baseLineWidth;
			const oppositeBaseDistanceWidth = $boxWidth - baseCheckElementDistanceY - _map.baseLineWidth;

			if (checkElement.x <= primaryBaseDistanceWidth || checkElement.x >= oppositeBaseDistanceWidth) {
				checkElement.step.x = -checkElement.step.x;

				if (checkElement.x <= primaryBaseDistanceWidth) {
					checkElement.x = primaryBaseDistanceWidth;
				} else {
					checkElement.x = oppositeBaseDistanceWidth;
				}

				return true;
			}
		}

		return false;
	};

	const checkMapBorderYCollision = (checkElement, _map) => {
		if (checkElement.step.y !== 0) {
			const baseCheckElementDistanceX = checkElement.radius ? checkElement.radius : 0;
			const baseCheckElementDistanceY = checkElement.radius ? checkElement.radius : checkElement.height;

			const primaryBaseDistanceHeight = baseCheckElementDistanceX + _map.baseLineWidth;
			const oppositeBaseDistanceHeight = $boxHeight - baseCheckElementDistanceY - _map.baseLineWidth;

			if (checkElement.y <= primaryBaseDistanceHeight || checkElement.y >= oppositeBaseDistanceHeight) {
				checkElement.step.y = -checkElement.step.y;

				if (checkElement.y <= primaryBaseDistanceHeight) {
					checkElement.y = primaryBaseDistanceHeight;
				} else {
					checkElement.y = oppositeBaseDistanceHeight;
				}

				return true;
			}
		}

		return false;
	};

	const checkMapElementCollision = (checkElement, _map, _playerAsTargetMapElement = null) => {
		// Two circles collision formula
		const _circlesCollision = (_checkRadius, _mapRadius, _checkCoord, _mapCoord, _checkCoordOther, _mapCoordOther) => (
			((_checkCoord - _mapCoord) ** 2) + ((_checkCoordOther - _mapCoordOther) ** 2) <= ((_checkRadius + _mapRadius) ** 2)
		);

		const _rectanglesCollisionBackward = (_checkCoord1, _mapCoord1, _checkCood2, _mapCood2) => (
			_checkCoord1 <= _mapCoord1 && _checkCood2 > _mapCood2
		);

		const _rectanglesCollisionFoward = (_checkCoord1, _mapCoord1, _checkCood2, _mapCood2) => (
			_checkCoord1 >= _mapCoord1 && _checkCood2 < _mapCood2
		);

		const _goCheckBroadRange = (_checkRadius, _mapRadius, _checkCoord, _mapCoord, _checkComplement, _mapComplement, checkStep) => {
			const secureCollisionValue = Math.abs(checkStep) + 1;
			const secureBorder = secureCollisionValue < (_mapComplement || _mapRadius) ? secureCollisionValue : (_mapComplement || _mapRadius);

			return (
				_checkRadius ? (
					_mapRadius ? (
						!(_checkCoord - _checkRadius > _mapCoord + _mapRadius - secureBorder || _checkCoord + _checkRadius < _mapCoord - _mapRadius + secureBorder)
					) : (
						!(_checkCoord - _checkRadius > _mapCoord + _mapComplement - secureBorder || _checkCoord + _checkRadius < _mapCoord + secureBorder)
					)
				) : (
					_mapRadius ? (
						!(_checkCoord > _mapCoord + _mapRadius - secureBorder || _checkCoord + _checkComplement < _mapCoord - _mapRadius + secureBorder)
					) : (
						!(_checkCoord > _mapCoord + _mapComplement - secureBorder || _checkCoord + _checkComplement < _mapCoord + secureBorder)
					)
				)
			);
		};

		// Two rectangles Collision axis backward (-X / -Y)
		const _goCheckCollisionBackward = (_checkRadius, _mapRadius, _checkCoord, _mapCoord, _mapComplement, _checkCoordOther, _mapCoordOther) => (
			_checkRadius ? (
				_mapRadius ? (
					_circlesCollision(_checkRadius, _mapRadius, _checkCoord, _mapCoord, _checkCoordOther, _mapCoordOther)
				) : (
					_rectanglesCollisionBackward(_checkCoord - _checkRadius, _mapCoord + _mapComplement, _checkCoord - _checkRadius, _mapCoord)
				)
			) : (
				_mapRadius ? (
					_rectanglesCollisionBackward(_checkCoord, _mapCoord + _mapRadius, _checkCoord, _mapCoord - _mapRadius)
				) : (
					_rectanglesCollisionBackward(_checkCoord, _mapCoord + _mapComplement, _checkCoord, _mapCoord)
				)
			)
		);

		// Two rectangles Collision axis foward (+X / +Y)
		const _goCheckCollisionFoward = (_checkRadius, _mapRadius, _checkCoord, _mapCoord, _checkComplement, _mapComplement, _checkCoordOther, _mapCoordOther) => (
			_checkRadius ? (
				_mapRadius ? (
					_circlesCollision(_checkRadius, _mapRadius, _checkCoord, _mapCoord, _checkCoordOther, _mapCoordOther)
				) : (
					_rectanglesCollisionFoward(_checkCoord + _checkRadius, _mapCoord, _checkCoord + _checkRadius, _mapCoord + _mapComplement)
				)
			) : (
				_mapRadius ? (
					_rectanglesCollisionFoward(_checkCoord + _checkComplement, _mapCoord - _mapRadius, _checkCoord + _checkComplement, _mapCoord + _mapRadius)
				) : (
					_rectanglesCollisionFoward(_checkCoord + _checkComplement, _mapCoord, _checkCoord + _checkComplement, _mapCoord + _mapComplement)
				)
			)
		);

		const _getCollidedData = (_checkElement, _mapElement) => {
			const checkElementHitBonus = (
				typeof _checkElement.hitBonus === 'number' && !isNaN(_checkElement.hitBonus) && _checkElement.hitBonus
			) || (
				0
			);

			const mapElementHitBonus = (
				typeof _mapElement.hitBonus === 'number' && !isNaN(_mapElement.hitBonus) && _mapElement.hitBonus
			) || (
				0
			);

			return (
				{
					elementOrigin: _checkElement,
					elementOriginHitBonus: checkElementHitBonus,
					elementTarget: _mapElement,
					elementTargetHitBonus: mapElementHitBonus
				}
			);
		};

		const _checkAtX = (_checkElement, _mapElement, _mapElements) => {
			const goCheckBroadRangeY = _goCheckBroadRange(_checkElement.radius, _mapElement.radius, _checkElement.y, _mapElement.y, _checkElement.height, _mapElement.height, _checkElement.step.y);

			if (goCheckBroadRangeY) {
				if (_checkElement.step.x < 0 || (_checkElement.step.x === 0 && (_mapElement.step && (_mapElement.step.x || 0) > 0))) {
					const goCheckCollisionBackwardX = _goCheckCollisionBackward(_checkElement.radius, _mapElement.radius, _checkElement.x, _mapElement.x, _mapElement.width, _checkElement.y, _mapElement.y);

					if (goCheckCollisionBackwardX) {
						// Collided
						const mayModifyElementsLifes = collisionActions(_checkElement, _mapElement, _mapElements, 1);

						if (mayModifyElementsLifes) {
							return _getCollidedData(_checkElement, _mapElement);
						}
					}
				} else {
					const goCheckCollisionFowardX = _goCheckCollisionFoward(_checkElement.radius, _mapElement.radius, _checkElement.x, _mapElement.x, _checkElement.width, _mapElement.width, _checkElement.y, _mapElement.y);

					if (goCheckCollisionFowardX) {
						// Collided
						const mayModifyElementsLifes = collisionActions(_checkElement, _mapElement, _mapElements, 2);

						if (mayModifyElementsLifes) {
							return _getCollidedData(_checkElement, _mapElement);
						}
					}
				}
			}

			return -1;
		};

		const _checkAtY = (_checkElement, _mapElement, _mapElements) => {
			const goCheckBroadRangeX = _goCheckBroadRange(_checkElement.radius, _mapElement.radius, _checkElement.x, _mapElement.x, _checkElement.width, _mapElement.width, _checkElement.step.x);

			if (goCheckBroadRangeX) {
				if (_checkElement.step.y < 0 || (_checkElement.step.y === 0 && (_mapElement.step && (_mapElement.step.y || 0) > 0))) {
					const goCheckCollisionBackwardY = _goCheckCollisionBackward(_checkElement.radius, _mapElement.radius, _checkElement.y, _mapElement.y, _mapElement.height, _checkElement.x, _mapElement.x);

					if (goCheckCollisionBackwardY) {
						// Collided
						const mayModifyElementsLifes = collisionActions(_checkElement, _mapElement, _mapElements, 3);

						if (mayModifyElementsLifes) {
							return _getCollidedData(_checkElement, _mapElement);
						}
					}
				} else {
					const goCheckCollisionFowardY = _goCheckCollisionFoward(_checkElement.radius, _mapElement.radius, _checkElement.y, _mapElement.y, _checkElement.height, _mapElement.height, _checkElement.x, _mapElement.x);

					if (goCheckCollisionFowardY) {
						// Collided
						const mayModifyElementsLifes = collisionActions(_checkElement, _mapElement, _mapElements, 4);

						if (mayModifyElementsLifes) {
							return _getCollidedData(_checkElement, _mapElement);
						}
					}
				}
			}

			return -1;
		};

		if (_playerAsTargetMapElement === null) {
			const resultForCheck = [];

			for (const mapElement of _map.elements) {
				if (mapElement.id !== checkElement.id) {
					const resultAtX = _checkAtX(checkElement, mapElement, _map.elements);
					const resultAtY = _checkAtY(checkElement, mapElement, _map.elements);

					if (resultAtX !== -1) {
						resultForCheck.push(resultAtX);
					}

					if (resultAtY !== -1) {
						resultForCheck.push(resultAtY);
					}
				}
			}

			if (resultForCheck.length) {
				return resultForCheck;
			}
		} else { // Exception case: player object as a target map element
			const resultAtX = _checkAtX(checkElement, _playerAsTargetMapElement, _map.elements);
			const resultAtY = _checkAtY(checkElement, _playerAsTargetMapElement, _map.elements);

			if (resultAtX !== -1) {
				return [resultAtX];
			}

			if (resultAtY !== -1) {
				return [resultAtY];
			}
		}

		return -1;
	};

	// Calculate element new modified life (if applicable)
	const setElementLifeModifier = (elementHitting, elementTakingHit, hitBonus) => {
		if (defaults.elementTypesCanHit.includes(elementHitting.type) && elementTakingHit && elementTakingHit.life && elementTakingHit.life > 0) {
			const damageTakenFactor = (elementTakingHit.damageTakenFactor || defaults.damageTakenFactor);
			const damageReducer = (damageTakenFactor >= defaults.damageTakenFactor ? 1 : damageTakenFactor / defaults.damageTakenFactor);

			const halfDamageTakenFactor = Math.round(damageTakenFactor / 2);
			const halfHitBonus = Math.round(hitBonus / 2);

			const lifeModifier = (
				hitBonus < 0 ? ( // Element gains life
					hitBonus + _randomIntFromInterval(0, halfHitBonus * -1)
				) : ( // Element loses life
					_randomIntFromInterval(halfDamageTakenFactor, damageTakenFactor) + (_randomIntFromInterval(halfHitBonus, hitBonus) * damageReducer)
				)
			);

			if (lifeModifier !== 0) {
				let lifeModifierReduceFactor = 1,
					goModifyLife = false;

				if (lifeModifier > 0) {
					const currentHitTimeCheck = Date.now();

					if (!elementHitting._isTimeBetweenHits || currentHitTimeCheck > elementHitting._isTimeBetweenHits) {
						// Only if it has a shield option - damage reduced by reduceFactor shield
						const shieldData = (elementTakingHit.skills && elementTakingHit.skills.shield);

						if (shieldData) {
							if (elementTakingHit._isShieldUp && shieldData.charges > 0) {
								elementTakingHit._shieldBreakAmount = (elementTakingHit._shieldBreakAmount || 0) + 1; // Counter for hits blocked

								const maxHitBreak = (shieldData.shieldBreakAmount || defaults.shieldBreakAmount); // Counter for hits blocked

								if (elementTakingHit._shieldBreakAmount % maxHitBreak === 0) {
									shieldData.charges -= 1;
									elementTakingHit._isShieldUp = false;
								}

								lifeModifierReduceFactor = (shieldData.shieldReduceFactor || defaults.shieldReduceFactor);
							}
						}

						elementTakingHit._isTakingDamage = true;
						elementHitting._isTimeBetweenHits = currentHitTimeCheck + (elementHitting.timeBetweenHits || defaults.timeBetweenHits);

						goModifyLife = true;
					}
				} else {
					goModifyLife = true;
				}

				if (goModifyLife) {
					const lifeModifierFinal = Math.round(lifeModifier / lifeModifierReduceFactor);
					const elementResultedLife = elementTakingHit.life - lifeModifierFinal;

					elementTakingHit.life = (elementResultedLife > 0 ? elementResultedLife : 0);

					// Increase aggro range (if applicable)
					if (elementTakingHit.id && elementTakingHit.aggroRange !== -1 && elementTakingHit.life > 0) { // Only map elements can have an id
						if ((elementHitting.idPlayer || elementHitting.ref === 'player')) {
							elementTakingHit.aggroRange = (elementTakingHit.aggroRange || defaults.aggroRange) + defaults.aggroRange;
						}
					}

					// Hit log
					setHitLog(elementTakingHit, lifeModifierFinal, hitBonus, damageTakenFactor, lifeModifierReduceFactor);
				}
			}
		}
	};

	const checkElementCollisions = (_mapElement, _player, _map) => {
		if (_mapElement.step) {
			checkMapBorderXCollision(_mapElement, _map);
			checkMapBorderYCollision(_mapElement, _map);

			const collidedPlayer = checkMapElementCollision(_mapElement, _map, _player); // Target player (element moves onto player)
			const collidedData = checkMapElementCollision(_mapElement, _map);

			if (collidedPlayer !== -1) {
				collidedPlayer.forEach(
					_collidedPlayer => {
					// Decrease/Increase current checkElement life
						const { elementOrigin, elementOriginHitBonus, elementTarget, elementTargetHitBonus } = _collidedPlayer;

						setElementLifeModifier(elementTarget, elementOrigin, elementTargetHitBonus);
						setElementLifeModifier(elementOrigin, elementTarget, elementOriginHitBonus);

						// Update menu screen
						setMenuScreen(_player, _map);
					}
				);
			}

			if (collidedData !== -1) {
				collidedData.forEach(
					_collidedData => {
						// Decrease/Increase current checkElement life
						const { elementOrigin, elementOriginHitBonus, elementTarget, elementTargetHitBonus } = _collidedData;

						setElementLifeModifier(elementTarget, elementOrigin, elementTargetHitBonus);
						setElementLifeModifier(elementOrigin, elementTarget, elementOriginHitBonus);
					}
				);
			}
		}
	};

	const checkPlayerCollisions = (_player, _map) => {
		checkMapBorderXCollision(_player, _map);
		checkMapBorderYCollision(_player, _map);

		const collidedPlayer = checkMapElementCollision(_player, _map); // Origin player (player moves onto element)

		if (collidedPlayer !== -1) {
			collidedPlayer.forEach(
				_collidedPlayer => {
					// Decrease/Increase player life (the current checkElement)
					const { elementOrigin, elementOriginHitBonus, elementTarget, elementTargetHitBonus } = _collidedPlayer;

					setElementLifeModifier(elementTarget, elementOrigin, elementTargetHitBonus);
					setElementLifeModifier(elementOrigin, elementTarget, elementOriginHitBonus);

					// Update menu screen
					setMenuScreen(_player, _map);
				}
			);
		}
	};

	// -----------------------------------------------------------------------------------------------
	// Action screen
	// -----------------------------------------------------------------------------------------------

	const setActionScreen = (_action, _cx, _player, _map) => {
		try {
			// Clean canvas
			_cx.clearRect(0, 0, $boxWidth, $boxHeight);

			// Map
			renderMap(_cx, _player, _map);

			// Player
			renderPlayer(_action, _cx, _player, _map);

			// Animation frames
			$animationFrameId = requestAnimationFrame(() => setActionScreen(_action, _cx, _player, _map));

			if (_player.life <= 0) {
				cancelAnimationFrame($animationFrameId);
				endGame(_action, _cx, _player);
			}
		} catch (err) {
			console.error(err); // eslint-disable-line no-console
		}
	};

	// -----------------------------------------------------------------------------------------------
	// Hit log screen
	// -----------------------------------------------------------------------------------------------
	const setHitLog = (_elementTakingHit, _lifeModifierFinal, _hitBonus, _damageTakenFactor, _lifeModifierReduceFactor) => {
		const hitLogContent = document.querySelector('#screen > div#general > div#menu > div#bottom > span#hit-log > div#content'); // Logs

		const logToWrite = (
			`${!_elementTakingHit.id ? `Player <strong>${_elementTakingHit.name}</strong>` : `Mob <strong>${(_elementTakingHit.name || _elementTakingHit.id)}</strong>`} &#10144;
				${
					_hitBonus !== undefined && _damageTakenFactor !== undefined && _lifeModifierReduceFactor !== undefined ? (
						` hitted by <strong>${_lifeModifierFinal}</strong>, hit bonus <strong>${_hitBonus}</strong> | damage taken factor <strong>${_damageTakenFactor}</strong> | reduce factor <strong>${_lifeModifierReduceFactor}</strong>`
					) : (
						` loses <strong>${_lifeModifierFinal}</strong> (time)`
					)
				}`
		);

		hitLogContent.innerHTML = `<div class="${_elementTakingHit.life > 0 ? (_lifeModifierFinal > 0 ? 'lose' : 'gain') : 'dead'}">${logToWrite}</div>${hitLogContent.innerHTML}`;
	};

	// -----------------------------------------------------------------------------------------------
	// Menu screen
	// -----------------------------------------------------------------------------------------------

	const setMenuScreen = (_player, _map) => {
		// Top
		const elMenuPlayerName = document.querySelector('#screen > div#general > div#menu > div#top span#player-name');
		const elMenuPlayerLife = document.querySelector('#screen > div#general > div#menu > div#top span#life');
		const elMenuPlayerShoot = document.querySelector('#screen > div#general > div#menu > div#top span#shoot');
		const elMenuPlayerShield = document.querySelector('#screen > div#general > div#menu > div#top span#shield');
		const elMenuPlayerSpeed = document.querySelector('#screen > div#general > div#menu > div#top span#speed');

		// Bottom
		const elMenuPlayerCounter = document.querySelector('#screen > div#general > div#menu > div#bottom span#timer');

		/*
		Data calculation
		*/

		// Check finite ammo
		const playerShotCharges = _player.skills && _player.skills.weapon && _player.skills.weapon.shoot && _player.skills.weapon.shoot.charges;

		// Shield
		const playerShield = (_player.skills && _player.skills.shield);
		const playerShieldCharges = (playerShield && playerShield.charges);
		const maxHitBreak = ((playerShield && playerShield.shieldBreakAmount) || defaults.shieldBreakAmount); // Counter for hits blocked
		const currentShieldBreakAmount = (playerShieldCharges ? (maxHitBreak - ((_player._shieldBreakAmount || 0) % maxHitBreak)) : 0);

		// Speed calc
		const playerSpeedStepX = Math.abs(_player.step.x);
		const playerSpeedStepY = Math.abs(_player.step.y);
		const playerSpeedFinal = Math.sqrt((playerSpeedStepX ** 2) + (playerSpeedStepY ** 2));

		const speedFinalShow = `${_numberFormatted(playerSpeedFinal, 1)} m/s`;

		/*
		Data show
		*/

		// Player name
		elMenuPlayerName.textContent = _player.name;

		// Life
		elMenuPlayerLife.textContent = `❤️ ${_player.life}`;

		// Shoot
		elMenuPlayerShoot.textContent = `🔫 ${playerShotCharges !== -1 ? playerShotCharges : '♾️'}`;

		// Shield
		elMenuPlayerShield.textContent = `🛡️ ${playerShieldCharges} / ${currentShieldBreakAmount}`;

		// Speed
		elMenuPlayerSpeed.textContent = `🏃 ${speedFinalShow}`;

		// Counter
		elMenuPlayerCounter.textContent = _timerFormatted(_map.timer);
	};

	// -----------------------------------------------------------------------------------------------
	// Base game
	// -----------------------------------------------------------------------------------------------

	// Globals
	let $keyDownHandlerBeginGame,
		$intervalTimer,
		$animationFrameId,
		$isOver,
		$boxWidth,
		$boxHeight;

	// Game over message
	const gameOverMessage = (_action, _cx, _player) => {
		const screenCheckW = _checkScreenBorders(_action.offsetWidth);
		const screenCheckY = _checkScreenBorders(_action.offsetHeight);

		const mapStartPointX = (
			$boxWidth < _action.offsetWidth ? (
				$boxWidth / 2
			) : (
				_player.x < screenCheckW ? (
					_action.offsetWidth / 2
				) : (
					_player.x > $boxWidth - screenCheckW ? (
						($boxWidth + _action.scrollLeft) / 2
					) : (
						_player.x
					)
				)
			)
		);

		const mapStartPointY = (
			$boxHeight < _action.offsetHeight ? (
				$boxHeight / 2
			) : (
				_player.y < screenCheckY ? (
					_action.offsetHeight / 2
				) : (
					_player.y > $boxHeight - screenCheckY ? (
						($boxHeight + _action.scrollTop) / 2
					) : (
						_player.y
					)
				)
			)
		);

		_cx.textBaseline = 'middle';
		_cx.textAlign = 'center';

		_cx.font = '900 48px Arial';
		_cx.fillText('Game Over', mapStartPointX, mapStartPointY);
	};

	// Actually ends
	const endGame = (_action, _cx, _player) => {
		$isOver = true;

		clearInterval($intervalTimer);

		// Keyboard listeners
		document.body.removeEventListener(
			'keydown',
			$keyDownHandlerBeginGame,
			false
		);

		document.body.addEventListener(
			'keypress',
			listeners.keyPressHandlerRestartGame,
			false
		);

		gameOverMessage(_action, _cx, _player);
	};

	// Actually starts
	const beginGame = (_action, _canvas, _cx, _player, _map) => {
		$isOver = false;

		$boxWidth = _canvas.width;
		$boxHeight = _canvas.height;

		$keyDownHandlerBeginGame = event => listeners.keyDownHandlerBeginGame(event, _player, _map);

		// Action screen
		setActionScreen(_action, _cx, _player, _map);

		// Menu screen
		setMenuScreen(_player, _map);

		$intervalTimer = setInterval(
			() => {
				_map.timer--;

				if (_map.timer === 0) { // End game if time runs out
					_player.life = 0;
				} else if (_map.timer % 5 === 0) { // Decrease life over time
					const lifeModifierFinal = 1;
					const playerResultedLife = _player.life - lifeModifierFinal;

					_player.life = (playerResultedLife > 0 ? playerResultedLife : 0);

					// Hit log
					setHitLog(_player, lifeModifierFinal);
				}

				setMenuScreen(_player, _map);
			},
			1000
		);

		// Keyboard listeners
		document.body.removeEventListener(
			'keypress',
			listeners.keyPressHandlerRestartGame,
			false
		);

		document.body.addEventListener(
			'keydown',
			$keyDownHandlerBeginGame,
			false
		);
	};

	// -----------------------------------------------------------------------------------------------
	// Load map
	const mapsRepo = () => {
		/*
			Maps images and elements colors
				-> each item in the outer array (first) defines a image map set (same order as maps)
				-> uses ids to replace properties in maps (style.fillStyle or style.color.body)

			type:
				1 - solid color
				2 - background image - pattern (repeat)
				3 - background image - pattern (no repeat)
				4 - background image - pattern (repeat-x)
				5 - background image - pattern (repeat-y)
				6 - callback related (linear or radial gradient)
		*/
		const mapsFillSpecial = [
			{
				idMap: 1,
				fillers: [
					{
						id: '%style.fillStyle%',
						content: './images/ground1.png',
						type: 2
					},
					{
						id: '%elements.2.style.color.body%',
						content: './images/brick1.png',
						type: 2
					},
					{
						id: '%elements.6.style.color.body%',
						content: './images/brick2.png',
						type: 2
					},
					{
						id: '%elements.11.style.color.body',
						content: _cx => {
							const gradient = _cx.createLinearGradient(0, 0, 800, 800);
							gradient.addColorStop(0.5, 'green');
							gradient.addColorStop(1, 'purple');

							return gradient;
						},
						type: 6
					},
					{
						id: '%elements.12.style.color.body',
						content: _cx => {
							const gradient = _cx.createLinearGradient(0, 0, 800, 800);
							gradient.addColorStop(0.5, 'gold');
							gradient.addColorStop(1, 'cyan');

							return gradient;
						},
						type: 6
					}
				]
			}
		];

		/*
			Maps details:
				-> each item in outer array (first) defines a map set (same order as mapsFillSpecial)
				-> uses ids from mapsFillSpecial.fillers to replace properties

			element -> type:
				1 - No collision, nothing happens
				2 - Collision -> persistent (origin keeps movement) - no hit possible
				3 - Collision -> persistent (origin keeps movement) - hit may produce damage or gain
				4 - Collision -> persistent (origin stops movement) - no hit possible
				5 - Collision -> persistent (origin stops movement) - hit may produce damage or gain
				6 - Collision -> persistent (origin reverts movement) - no hit possible
				7 - Collision -> persistent (origin reverts movement) - hit may produce damage or gain
				8 - Collision -> disappear on every collision - as origin or target (except borders) - no hit possible
				9 - Collision -> disappear on every collision - as origin or target (except borders) - hit may produce damage or gain
				10 - Collision -> disappear only if receives the collision - as target (except borders) - no hit possible
				11 - Collision -> disappear only if receives the collision - as target (except borders) - hit may produce damage or gain
				101 - Collision -> persistent (origin keeps movement) - hit may produce damage or gain (Platform mode)
				201 - collision -> persistent (origin keeps movement) - hit may produce damage or gain (only for mobs!)

			** player starting point: 'mid' for middle screen ou number in pixels
			** Hint: put all diable elements (with life property) in the end of the array for render performance
		*/
		const maps = [
			{
				idMap: 1,
				name: 'Unstable void',
				timer: 900,
				baseLineWidth: 20,
				style: {
					outline: 'darkred',
					fillStyle: '%style.fillStyle%'
				},
				players: {
					startPointX: 'mid',
					startPointY: 'mid'
				},
				elements: [
					{
						id: 1,
						type: 3,
						width: 65,
						height: 260,
						x: 148,
						y: 198,
						style: {
							color: {
								body: 'rgba(238, 238, 238, 0.6)'
							},
							border: {
								width: 1,
								color: 'green'
							}
						}
					},
					{
						id: 2,
						type: 2,
						width: 60,
						height: 255,
						// Experiment: rotate: 10, // Rotate (in degrees) is only valid with width/height and does not work with collisions!
						x: 150,
						y: 200,
						style: {
							color: {
								body: '%elements.2.style.color.body%'
							},
							border: {
								width: 1,
								color: 'green'
							}
						}
					},
					{
						id: 3,
						type: 2,
						width: 200,
						height: 50,
						x: 290,
						y: 110,
						style: {
							color: {
								body: 'orangered'
							}
						}
					},
					{
						id: 4,
						type: 2,
						width: 200,
						height: 50,
						x: 290,
						y: 550,
						style: {
							color: {
								body: 'olive'
							}
						}
					},
					{
						id: 5,
						type: 2,
						width: 150,
						height: 150,
						x: 800,
						y: 150,
						style: {
							color: {
								body: 'silver'
							}
						}
					},
					{
						id: 6,
						type: 2,
						radius: 60,
						x: 600,
						y: 280,
						style: {
							color: {
								body: '%elements.6.style.color.body%'
							},
							border: {
								width: 2,
								color: 'black'
							}
						}
					},
					{
						id: 7,
						type: 2,
						radius: 80,
						x: 950,
						y: 550,
						style: {
							color: {
								body: 'deepskyblue'
							}
						}
					},
					{
						id: 8,
						type: 2,
						radius: 120,
						x: 1300,
						y: 350,
						style: {
							color: {
								body: 'yellow'
							}
						}
					},
					{
						id: 9,
						type: 7,
						width: 80,
						height: 20,
						x: 20,
						y: 90,
						style: {
							color: {
								body: 'darkgreen'
							}
						},
						step: { // Only applicable if element can move or it is in platform mode (stacked in place)
							x: 6,
							y: 0
						}
					},
					{
						id: 10,
						type: 11,
						width: 20,
						height: 20,
						x: 960,
						y: 260,
						hitBonus: -500, // Only applicable if element type can hit (if negative, element gains life)
						style: {
							color: {
								body: 'red'
							}
						}
					},
					{
						id: 11,
						name: 'Gamon',
						life: 750,
						damageTakenFactor: 15, // Only applicable if element has a life property
						type: 201, // Type 201 defines the mob type, used only for mobs
						radius: 30,
						x: 500,
						y: 500,
						currentDirection: 9, // Must have for getting and drawning element direction
						hitBonus: 20, // Only applicable if element type can hit
						aggroGroup: 1,
						style: {
							color: {
								body: '%elements.11.style.color.body',
								details: 'aquamarine'
							}
						},
						step: { // Only applicable if element can move or it is in platform mode (stacked in place)
							x: -3,
							y: 3,
							rangeLimit: { // Range limit for x or y movement (only for map elements)
								maxX: 600,
								minY: 400
							}
						},
						skills: {
							shield: {
								shieldReduceFactor: 3,
								charges: 5
							}
						}
					},
					{
						id: 12,
						name: 'Zok',
						life: 950,
						damageTakenFactor: 25, // Only applicable if element has a life property
						type: 201, // Type 201 defines the mob type, used only for mobs
						width: 50,
						height: 50,
						x: 900,
						y: 50,
						currentDirection: 11, // Must have for getting and drawning element direction
						hitBonus: 30, // Only applicable if element type can hit
						aggroRange: 300, // Optional, only applicable if element has a life property... use -1 for no aggro permitted
						hitPauseTimeCheck: [6, 5000], // Optional, only applicable if element can shoot ([maxHitTrigger ,timeToWait] (timeToWait in miliseconds))
						style: {
							color: {
								body: '%elements.12.style.color.body',
								details: 'darkorange'
							}
						},
						step: { // Only applicable if element can move or it is in platform mode (stacked in place)
							x: 1,
							y: 1
						},
						skills: {
							shield: {
								shieldBreakAmount: 10,
								charges: 1
							},
							weapon: {
								shoot: {
									isShootingColor: 'yellow',
									shootSpeed: 8,
									charges: 50, // -1 for infinite ammo
									baseElement : { // New element guide (basic data)
										ref: 'env', // Mandatory for base elements (player for ref from player or env for ref from environment)
										type: 9, // Always use 9 for munition element (disappear on collision)
										radius: 10, // Always use radius for munition element (centering)
										hitBonus: 60, // Only applicable if element type can hit (ranged)
										style: {
											color: {
												body: 'red'
											}
										}
									}
								}
							}
						}
					},
					{
						id: 13,
						name: 'Tundro',
						life: 1250,
						damageTakenFactor: 45, // Only applicable if element has a life property
						type: 201, // Type 201 defines the mob type, used only for mobs
						width: 35,
						height: 35,
						x: 700,
						y: 150,
						currentDirection: 10, // Must have for getting and drawning element direction
						hitBonus: 200, // Only applicable if element type can hit
						aggroGroup: 1,
						style: {
							color: {
								body: 'brown',
								details: 'cyan'
							}
						},
						step: { // Only applicable if element can move or it is in platform mode (stacked in place)
							x: 0,
							y: 0
						}
					},
					{
						id: 14,
						name: 'Shot tower',
						life: 2000,
						damageTakenFactor: 45, // Only applicable if element has a life property
						type: 101, // Type 101 defines the plataform mode (element can have a direction, but can not move)
						width: 60,
						height: 60,
						x: 21,
						y: 21,
						currentDirection: 10, // Must have for getting and drawning element direction
						hitBonus: 100, // Only applicable if element type can hit
						aggroRange: 600, // Optional, only applicable if element has a life property... use -1 for no aggro permitted
						style: {
							color: {
								body: 'blue',
								details: 'green'
							}
						},
						step: { // Only applicable if element can move or it is in platform mode (stacked in place)
							x: 0,
							y: 0
						},
						skills: {
							weapon: {
								shoot: {
									isShootingColor: 'yellow',
									shootSpeed: 5,
									charges: 200, // -1 for infinite ammo
									baseElement : { // New element guide (basic data)
										ref: 'env', // Mandatory for base elements (player for ref from player or env for ref from environment)
										type: 9, // Always use 9 for munition element (disappear on collision)
										radius: 30, // Always use radius for munition element (centering)
										hitBonus: 150, // Only applicable if element type can hit (ranged)
										style: {
											color: {
												body: 'red'
											}
										}
									}
								}
							}
						}
					}
				]
			}
		];

		return (
			{
				mapsFillSpecial,
				maps
			}
		);
	};

	const loadMapFillData = mapFillItem => (
		new Promise(
			(resolve, reject) => {
				switch (mapFillItem.type) {
					case 1:
					case 6: {
						resolve(
							{
								id: mapFillItem.id,
								fill: mapFillItem.content,
								type: mapFillItem.type
							}
						);

						break;
					}
					case 2:
					case 3:
					case 4:
					case 5: {
						const mapImage = new Image();

						mapImage.src = mapFillItem.content;

						mapImage.onload = () => resolve(
							{
								id: mapFillItem.id,
								fill: mapImage,
								type: mapFillItem.type
							}
						);

						mapImage.onabort = () => reject(
							new Error(`Error loading map image ${mapFillItem.content} - aborting...`)
						);

						mapImage.onerror = () => reject(
							new Error(`Error loading map image ${mapFillItem.content}...'`)
						);

						break;
					}
					default: {
						resolve(
							{
								id: mapFillItem.id,
								fill: '',
								type: mapFillItem.type
							}
						);
					}
				}
			}
		)
	);

	const loadMapData = (_mapsFillSpecial, _maps, _mapId) => (
		new Promise(
			(resolve, reject) => {
				const mapFillSpecial = _mapsFillSpecial.filter(map => _mapId && map.idMap === _mapId).pop().fillers;
				const map = _maps.filter(map => _mapId && map.idMap === _mapId).pop();

				const arrFillSpecial = [];

				mapFillSpecial.forEach(
					item => arrFillSpecial.push(loadMapFillData(item))
				);

				Promise.all(arrFillSpecial)
				.then(
					result => {
						resolve(
							{
								map: map,
								arrFillSpecial: result
							}
						);
					}
				)
				.catch(
					err => reject(err)
				);
			}
		)
	);

	const getMapData = (_cx, mapId) => (
		new Promise(
			(resolve, reject) => {
				const { mapsFillSpecial, maps } = mapsRepo();

				loadMapData(mapsFillSpecial, maps, mapId)
				.then(
					result => {
						const map = result.map;
						const arrFillSpecial = result.arrFillSpecial;

						arrFillSpecial.forEach(
							item => {
								const mapId = item.id;
								const mapFill = item.fill;
								const mapType = item.type;

								const mapFillStyle = (
									mapType === 1 ? (
										mapFill
									) : (
										mapType === 6 ? (
											typeof mapFill === 'function' && mapFill(_cx)
										) : (
											(mapType === 2 || mapType === 3 || mapType === 4 || mapType === 5) ? (
												_cx.createPattern(
													mapFill,
													(
														mapType === 2 ? (
															'repeat'
														) : (
															mapType === 3 ? (
																'no-repeat'
															) : (
																mapType === 4 ? (
																	'repeat-x'
																) : (
																	'repeat-y'
																)
															)
														)
													)
												)
											) : (
												mapFill
											)
										)
									)
								);

								// Find object key by its value (id) and replace with new value
								_objFindAndReplace(map, mapId, mapFillStyle);
							}
						);

						resolve(map);
					}
				)
				.catch(
					err => reject(err)
				);
			}
		)
	);

	const setMap = (_action, _canvas, _cx, _player) => {
		getMapData(_cx, 1)
		.then(
			map => {
				// Initial map player coordinates
				const mapStartPointX = (
					map.players ? (
						map.players.startPointX === 'mid' ? (
							_canvas.width < _action.offsetWidth ? _canvas.width / 2 : _action.offsetWidth / 2
						) : (
							typeof map.players.startPointX === 'number' && !isNaN(map.players.startPointX) ? (
								map.players.startPointX
							) : (
								0
							)
						)
					) : (
						0
					)
				);

				const mapStartPointY = (
					map.players ? (
						map.players.startPointY === 'mid' ? (
							_canvas.height < _action.offsetHeight ? _canvas.height / 2 : _action.offsetHeight / 2
						) : (
							typeof map.players.startPointY === 'number' && !isNaN(map.players.startPointY) ? (
								map.players.startPointY
							) : (
								0
							)
						)
					) : (
						0
					)
				);

				const playerStartPointX = _player.x; // Initially added to mapStartPointX
				const playerStartPointY = _player.y; // Initially added to mapStartPointY

				_player.x = mapStartPointX + playerStartPointX;
				_player.y = mapStartPointY + playerStartPointY;

				beginGame(_action, _canvas, _cx, _player, map);
			}
		)
		.catch(
			err => console.error(err) // eslint-disable-line no-console
		);
	};

	// -----------------------------------------------------------------------------------------------
	// Load player
	const playersRepo = () => {
		const playersRepo = [
			{
				idPlayer: 1,
				name: 'Mike',
				life: 500,
				damageTakenFactor: 35, // Only applicable if element has a life property
				timeBetweenHits: 250, // Time between element hits, only applicable if element can hit (in this case considered melee hits)
				type: 3, // Type of the player object (based on the maps element types)
				radius: 20,
				x: 0, // Initially added to mapStartPointX
				y: 0, // Initially added to mapStartPointY
				currentDirection: 1, // Must have for getting and drawning element direction
				hitBonus: 10, // Only applicable if element type can hit
				style: {
					color: {
						body: 'black',
						details: 'red'
					}
				},
				step: { // Only applicable if element can move or it is in platform mode (stacked in place)
					x: 0,
					y: 0,
					increment: 1,
					xMax: 5,
					yMax: 5
				},
				skills: {
					shield: {
						isShieldUpColor: 'ghostwhite',
						shieldReduceFactor: 4,
						shieldBreakAmount: 8,
						charges: 10
					},
					weapon: {
						shoot: {
							isShootingColor: 'yellow',
							shootSpeed: 12,
							charges: 200, // -1 for infinite ammo
							baseElement : { // New element guide (basic data)
								ref: 'player', // Mandatory for base elements (player for ref from player or env for ref from environment)
								type: 9, // Always use 9 for munition element (disappear on collision)
								radius: 10, // Always use radius for munition element (centering)
								hitBonus: 50, // Only applicable if element type can hit (ranged)
								style: {
									color: {
										body: 'red'
									}
								}
							}
						}
					}
				}
			}
		];

		return playersRepo;
	};

	const getPlayerData = playerId => {
		const players = playersRepo();
		return players.filter(player => playerId && player.idPlayer === playerId).pop();
	};

	const setPlayer = (_action, _canvas, _cx) => {
		const player = getPlayerData(1);
		setMap(_action, _canvas, _cx, player);
	};

	// Start game
	const startGame = () => {
		try {
			const action = document.querySelector('#screen > div#action');
			const canvas = document.querySelector('#screen > div#action > canvas');

			action.scrollTop = 0;
			action.scrollLeft = 0;

			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;

			const cx = canvas.getContext('2d');

			setPlayer(action, canvas, cx);
		} catch (err) {
			console.error(err); // eslint-disable-line no-console
		}
	};

	// Restart game
	const restartGame = () => {
		if ($isOver === true) {
			startGame();
		}
	};

	startGame();
})();
