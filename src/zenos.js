'use strict';

(function () {
	// -----------------------------------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------------------------------

	// Generic game helpers

	// Default values
	const defaults = {
		damageTakenFactor: 50,
		isTakingDamageColor: 'red',
		isShootingColor: 'red',
		shootSpeed: 15
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

		if (_element.style.currentDirection) { // Only makes sense if element has a side direction
			if (_element.step.x === 0 && _element.step.y === 0) {
				currentElementDirection = _element.style.currentDirection;
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
					_element.style.currentDirection = currentElementDirection;
				}
			}
		}

		return currentElementDirection;
	};

	// Drawn element body and direction (if applicable)
	const _drawnElement = (_cx, _element, _currentPlayerDirection) => {
		const elementIsACircle = _element.radius || false;

		// Drawn element body
		if (elementIsACircle) {
			_cx.save();

			_cx.beginPath();
			_cx.arc(_element.x, _element.y, _element.radius, 0, 2 * Math.PI);
			_cx.fillStyle = _element.style.color.body;
			_cx.fill();
			_cx.closePath();

			_cx.restore();
		} else {
			_cx.save();

			if (_element.rotate) {
				_cx.translate(_element.x, _element.y);
				_cx.rotate(_element.rotate * Math.PI / 180);
				_cx.translate(-_element.x, -_element.y);
			}

			_cx.fillStyle = _element.style.color.body;
			_cx.fillRect(_element.x, _element.y, _element.width, _element.height);

			_cx.restore();
		}

		// Drawn element direction
		if (_element.style.currentDirection) { // Only makes sense if element has a side direction
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

			switch (_currentPlayerDirection) {
				case -11: { // NW
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
				case -10: { // N
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
				case -9: { // NE
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
				case -1: { // W
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
				case 1: { // E
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
				case 9: { // SW
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
				case 10: { // S
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
				case 11: { // SE
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

	// Drawns element shots (works better with circle and square elements)
	// Shot drawning is always in circle format (for performance)
	const _drawnElementShot = (elementShooting, _map, _newShootDataBaseElement, _newShootDataSpeed) => {
		const currentElementDirection = _getElementDirection(elementShooting);

		const checkDirectionXpositive = [-9, 1, 11].includes(currentElementDirection);
		const checkDirectionXnegative = [-11, -1, 9].includes(currentElementDirection);
		const checkDirectionYpositive = [9, 10, 11].includes(currentElementDirection);
		const checkDirectionYnegative = [-11, -10, -9].includes(currentElementDirection);

		const secureCollisionValue = (
			elementShooting.radius ? (
				elementShooting.radius + _newShootDataBaseElement.radius
			) : (
				elementShooting.width >= elementShooting.height ? (
					(elementShooting.width / 2) + _newShootDataBaseElement.radius
				) : (
					(elementShooting.height / 2) + _newShootDataBaseElement.radius
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

		const shootSpeed = (_newShootDataSpeed || defaults.shootSpeed);

		const shootStepX = (elementShooting.step.x > 0 || checkDirectionXpositive) ? (
			shootSpeed
		) : (
			(elementShooting.step.x < 0 || checkDirectionXnegative) ? (
				shootSpeed * -1
			) : (
				0
			)
		);

		const shootStepY = (elementShooting.step.y > 0 || checkDirectionYpositive) ? (
			shootSpeed
		) : (
			(elementShooting.step.y < 0 || checkDirectionYnegative) ? (
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
			id: shootDataId + 1,
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
		debounceKeyDownHandler: (_event, _player, _map, _debounceKeyDownWait) => {
			_event.preventDefault();

			// Movements / actions -> shield (q) / space / arrow up / arrow down/ arrow left / arrow right (debounced)
			const keyPressed = () => {
				switch (_event.key) {
					case 'q':
					case 'Q': {
						if (!_player.skills.shield.up && _player.skills.shield.charges > 0) {
							_player.skills.shield.up = true;
						} else {
							_player.skills.shield.up = false;
						}

						break;
					}
					case 'w':
					case 'W': {
						const newShootData = (_player.skills && _player.skills.weapon && _player.skills.weapon.shoot) ? (
							_player.skills.weapon.shoot
						) : (
							undefined
						);

						if (newShootData) {
							const chekInfiniteAmmo = newShootData.charges === -1;
							const chargesLeft = !chekInfiniteAmmo && newShootData.charges;

							if (chekInfiniteAmmo || chargesLeft > 0) {
								const newShootDataBaseElement = { ...newShootData.baseElement };
								const newShootDataSpeed = newShootData.shootSpeed;

								_drawnElementShot(_player, _map, newShootDataBaseElement, newShootDataSpeed);

								if (_player._actions) {
									_player._actions.isShooting = true;
								}

								if (!chekInfiniteAmmo) {
									_player.skills.weapon.shoot.charges -= 1;
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

			clearTimeout($debounceKeyDownTimer);
			$debounceKeyDownTimer = setTimeout(keyPressed, _debounceKeyDownWait);
		},
		restartkeyPressHandler: _event => {
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

	const moveMapElement = _mapElement => {
		if (_mapElement.step && _mapElement.step.x) {
			if (_mapElement.step.x !== 0) {
				_mapElement.x += _mapElement.step.x;
			}
		}

		if (_mapElement.step && _mapElement.step.y) {
			if (_mapElement.step.y !== 0) {
				_mapElement.y += _mapElement.step.y;
			}
		}
	};

	const drawMapElements = (_cx, _map) => {
		const _drawnElementDetails = _mapElement => {
			// Takes damage
			if (_mapElement._actions) {
				if (_mapElement._actions.isTakingDamage) {
					_mapElement.style.color.body = defaults.isTakingDamageColor;
					_mapElement._actions.isTakingDamage = false;
				} else {
					if (!_mapElement.style.color.savedBody) {
						_mapElement.style.color.savedBody = _mapElement.style.color.body; // Temporary
					}

					_mapElement.style.color.body = _mapElement.style.color.savedBody;
				}
			}
		};

		const mapElements = _map.elements;

		// Elements for base screen
		for (const mapElement of mapElements) {
			const hasLife = Object.prototype.hasOwnProperty.call(mapElement, 'life');

			// Remove life zero or less elements
			if (hasLife && mapElement.life <= 0) {
				const itemToRemove = mapElements.findIndex(item => item.id === mapElement.id);

				if (itemToRemove !== -1) {
					mapElements.splice(itemToRemove, 1);
				}
			} else {
				// Movement (if applicable)
				moveMapElement(mapElement);

				// Collisions
				checkElementCollisions(mapElement, _map);

				// Element direction (if applicable)
				const currentElementDirection = _getElementDirection(mapElement);

				// Drawn element body (direction if applicable)
				_drawnElement(_cx, mapElement, currentElementDirection);

				// Drawn element details (damage, ...)
				_drawnElementDetails(mapElement);
			}
		}
	};

	const renderMap = (_cx, _map) => {
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
		drawMapElements(_cx, _map);
	};

	// -----------------------------------------------------------------------------------------------
	// Player
	// -----------------------------------------------------------------------------------------------

	const movePlayer = (_action, _player) => {
		if (_player.step && _player.step.x) {
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

		if (_player.step && _player.step.y) {
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
	};

	const renderPlayer = (_action, _cx, _player, _map) => {
		const _drawnPlayerDetails = (_cx, _player) => {
			if (_player._actions) {
				// Takes damage
				if (_player._actions.isTakingDamage) {
					_player.style.color.body = defaults.isTakingDamageColor;
					_player._actions.isTakingDamage = false;
				} else {
					if (!_player.style.color.savedBody) {
						_player.style.color.savedBody = _player.style.color.body; // Temporary
					}

					_player.style.color.body = _player.style.color.savedBody;
				}

				// Weapon shoot
				if (_player._actions.isShooting) {
					_player.style.color.details = (_player.skills.weapon.shoot.isShootingColor || defaults.isShootingColor);
					_player._actions.isShooting = false;
				} else {
					if (!_player.style.color.savedDetails) {
						_player.style.color.savedDetails = _player.style.color.details; // Temporary
					}

					_player.style.color.details = _player.style.color.savedDetails;
				}
			}

			// Shield
			if (_player.skills.shield.up && _player.skills.shield.charges > 0) {
				_cx.save();

				_cx.lineWidth = 1;

				_cx.beginPath();
				_cx.arc(_player.x, _player.y, _player.radius * 1.5, 0, 2 * Math.PI);
				_cx.strokeStyle = _player.skills.shield.shieldUpColor;
				_cx.stroke();
				_cx.closePath();

				_cx.restore();
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

		// Drawn player details (damage, ...)
		_drawnPlayerDetails(_cx, _player);
	};

	// -----------------------------------------------------------------------------------------------
	// Collisions
	// -----------------------------------------------------------------------------------------------

	const collisionActions = (_checkElement, _mapElement, _mapElements, _idActiveElement, phase) => {
		let mayModifyCheckElementLife = false;

		if (_checkElement.type && [8, 9].includes(_checkElement.type)) { // Remove active element (origin)
			const itemToRemove = _mapElements.findIndex(item => item.id === _idActiveElement);

			if (itemToRemove !== -1) {
				_mapElements.splice(itemToRemove, 1);
			}
		}

		switch (_mapElement.type) {
			case 2: // Keep movement
			case 3: // Keep movement
			case 4: // Stop movement
			case 5: // Stop movement
			case 6: // Revert movement
			case 7: { // Revert movement
				const _getAidValues = (_checkElement, _mapElement) => { // Values to avoid penetration inside the _mapElement
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

				if (_checkElement.step.x !== 0) {
					const adjustPenetrationX = (
						Math.abs(_checkElement.x - _mapElement.x + _checkElement.step.x) < Math.abs(_checkElement.x - _mapElement.x)
					);

					let executeAction = false;

					if (phase === 1 && _checkElement.step.x < 0) {
						if (adjustPenetrationX) {
							_checkElement.x = _mapElement.x + aidValues.baseCheckElementDistanceX + aidValues.baseMapElementDistanceX;
							executeAction = true;
						}
					} else if (phase === 2 && _checkElement.step.x > 0) {
						if (adjustPenetrationX) {
							_checkElement.x = _mapElement.x - aidValues.baseCheckElementDistanceX - aidValues.baseMapElementDistanceX;
							executeAction = true;
						}
					}

					if (executeAction) {
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
					}
				}

				if (_checkElement.step.y !== 0) {
					const adjustPenetrationY = (
						Math.abs(_checkElement.y - _mapElement.y + _checkElement.step.y) < Math.abs(_checkElement.y - _mapElement.y)
					);

					let executeAction = false;

					if (phase === 3 && _checkElement.step.y < 0) {
						if (adjustPenetrationY) {
							_checkElement.y = _mapElement.y + aidValues.baseCheckElementDistanceY + aidValues.baseMapElementDistanceY;
							executeAction = true;
						}
					} else if (phase === 4 && _checkElement.step.y > 0) {
						if (adjustPenetrationY) {
							_checkElement.y = _mapElement.y - aidValues.baseCheckElementDistanceY - aidValues.baseMapElementDistanceY;
							executeAction = true;
						}
					}

					if (executeAction) {
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
					}
				}

				if ([3, 5, 7].includes(_mapElement.type)) { // Receives damage
					mayModifyCheckElementLife = true;
				}

				break;
			}
			case 8:
			case 9:
			case 10:
			case 11: { // Remove item
				const itemToRemove = _mapElements.findIndex(item => item.id === _mapElement.id);

				if (itemToRemove !== -1) {
					_mapElements.splice(itemToRemove, 1);
				}

				if ([9, 11].includes(_mapElement.type)) { // Receives damage
					mayModifyCheckElementLife = true;
				}

				break;
			}
		}

		return mayModifyCheckElementLife;
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

	const checkMapElementCollision = (checkElement, _map, _idActiveElement = null) => {
		// Two circles collision formula
		const _circlesCollision = (_checkRadius, _mapRadius, _checkCoord, _mapCoord, _checkCoordOther, _mapCoordOther) => (
			((_checkCoord - _mapCoord) ** 2) + ((_checkCoordOther - _mapCoordOther) ** 2) <= ((_checkRadius + _mapRadius) ** 2)
		);

		const goCheckBroadRange = (_checkRadius, _mapRadius, _checkCoord, _mapCoord, _checkComplement, _mapComplement, checkStep) => {
			const secureCollisionValue = Math.abs(checkStep) * 1.5;
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
		const goCheckCollisionBackward = (_checkRadius, _mapRadius, _checkCoord, _mapCoord, _mapComplement, _checkCoordOther, _mapCoordOther) => (
			_checkRadius ? (
				_mapRadius ? (
					_circlesCollision(_checkRadius, _mapRadius, _checkCoord, _mapCoord, _checkCoordOther, _mapCoordOther)
				) : (
					_checkCoord - _checkRadius <= _mapCoord + _mapComplement && _checkCoord - _checkRadius > _mapCoord
				)
			) : (
				_mapRadius ? (
					_checkCoord <= _mapCoord + _mapRadius && _checkCoord > _mapCoord - _mapRadius
				) : (
					_checkCoord <= _mapCoord + _mapComplement && _checkCoord > _mapCoord
				)
			)
		);

		// Two rectangles Collision axis foward (+X / +Y)
		const goCheckCollisionFoward = (_checkRadius, _mapRadius, _checkCoord, _mapCoord, _checkComplement, _mapComplement, _checkCoordOther, _mapCoordOther) => (
			_checkRadius ? (
				_mapRadius ? (
					_circlesCollision(_checkRadius, _mapRadius, _checkCoord, _mapCoord, _checkCoordOther, _mapCoordOther)
				) : (
					_checkCoord + _checkRadius >= _mapCoord && _checkCoord + _checkRadius < _mapCoord + _mapComplement
				)
			) : (
				_mapRadius ? (
					_checkCoord + _checkComplement >= _mapCoord - _mapRadius && _checkCoord + _checkComplement < _mapCoord + _mapRadius
				) : (
					_checkCoord + _checkComplement >= _mapCoord && _checkCoord + _checkComplement < _mapCoord + _mapComplement
				)
			)
		);

		const checkCollisionBonusLifeModifier = _mapElement => (
			(
				_mapElement.hit && typeof _mapElement.hit.bonusLifeModifier === 'number' && !isNaN(_mapElement.hit.bonusLifeModifier) && _mapElement.hit.bonusLifeModifier
			) || (
				0
			)
		);

		const _checkAtX = (_checkElement, _mapElement, _mapElements, _idActiveElement) => {
			const goCheckBroadRangeY = goCheckBroadRange(_checkElement.radius, _mapElement.radius, _checkElement.y, _mapElement.y, _checkElement.height, _mapElement.height, _checkElement.step.y);

			if (goCheckBroadRangeY) {
				if (_checkElement.step.x < 0 || (_checkElement.step.x === 0 && (_mapElement.step && (_mapElement.step.x || 0) > 0))) {
					const goCheckCollisionBackwardX = goCheckCollisionBackward(_checkElement.radius, _mapElement.radius, _checkElement.x, _mapElement.x, _mapElement.width, _checkElement.y, _mapElement.y);

					if (goCheckCollisionBackwardX) {
						// Collided
						const mayModifyCheckElementLife = collisionActions(_checkElement, _mapElement, _mapElements, _idActiveElement, 1);

						if (mayModifyCheckElementLife) {
							return checkCollisionBonusLifeModifier(_mapElement);
						}
					}
				} else {
					const goCheckCollisionFowardX = goCheckCollisionFoward(_checkElement.radius, _mapElement.radius, _checkElement.x, _mapElement.x, _checkElement.width, _mapElement.width, _checkElement.y, _mapElement.y);

					if (goCheckCollisionFowardX) {
						// Collided
						const mayModifyCheckElementLife = collisionActions(_checkElement, _mapElement, _mapElements, _idActiveElement, 2);

						if (mayModifyCheckElementLife) {
							return checkCollisionBonusLifeModifier(_mapElement);
						}
					}
				}
			}

			return NaN;
		};

		const _checkAtY = (_checkElement, _mapElement, _mapElements, _idActiveElement) => {
			const goCheckBroadRangeX = goCheckBroadRange(_checkElement.radius, _mapElement.radius, _checkElement.x, _mapElement.x, _checkElement.width, _mapElement.width, _checkElement.step.x);

			if (goCheckBroadRangeX) {
				if (_checkElement.step.y < 0 || (_checkElement.step.y === 0 && (_mapElement.step && (_mapElement.step.y || 0) > 0))) {
					const goCheckCollisionBackwardY = goCheckCollisionBackward(_checkElement.radius, _mapElement.radius, _checkElement.y, _mapElement.y, _mapElement.height, _checkElement.x, _mapElement.x);

					if (goCheckCollisionBackwardY) {
						// Collided
						const mayModifyCheckElementLife = collisionActions(_checkElement, _mapElement, _mapElements, _idActiveElement, 3);

						if (mayModifyCheckElementLife) {
							return checkCollisionBonusLifeModifier(_mapElement);
						}
					}
				} else {
					const goCheckCollisionFowardY = goCheckCollisionFoward(_checkElement.radius, _mapElement.radius, _checkElement.y, _mapElement.y, _checkElement.height, _mapElement.height, _checkElement.x, _mapElement.x);

					if (goCheckCollisionFowardY) {
						// Collided
						const mayModifyCheckElementLife = collisionActions(_checkElement, _mapElement, _mapElements, _idActiveElement, 4);

						if (mayModifyCheckElementLife) {
							return checkCollisionBonusLifeModifier(_mapElement);
						}
					}
				}
			}

			return NaN;
		};

		for (const mapElement of _map.elements) {
			if (mapElement.id !== _idActiveElement) {
				const resultAtX = _checkAtX(checkElement, mapElement, _map.elements, _idActiveElement);
				const resultAtY = _checkAtY(checkElement, mapElement, _map.elements, _idActiveElement);

				if (!isNaN(resultAtX)) {
					return resultAtX;
				}

				if (!isNaN(resultAtY)) {
					return resultAtY;
				}
			}
		}

		return NaN;
	};

	// Calculate element new modified life (if applicable)
	const getElementLifeModifier = (elementTakingHit, bonusLifeModifier) => {
		if (elementTakingHit && elementTakingHit.life && elementTakingHit.life > 0) {
			const damageTakenFactor = (elementTakingHit.damageTakenFactor || defaults.damageTakenFactor);
			const halfDamageTakenFactor = Math.round(damageTakenFactor / 2);
			const halfBonusLifeModifier = Math.round(bonusLifeModifier / 2);

			const lifeModifierCurrent = (
				bonusLifeModifier < 0 ? ( // Element gains life
					bonusLifeModifier + _randomIntFromInterval(0, halfBonusLifeModifier * -1)
				) : ( // Element loses life
					_randomIntFromInterval(halfDamageTakenFactor, damageTakenFactor) + _randomIntFromInterval(halfBonusLifeModifier, bonusLifeModifier)
				)
			);

			// Only if it has a shield option
			if (lifeModifierCurrent >= 0 && elementTakingHit.skills && elementTakingHit.skills.shield && elementTakingHit.skills.shield.up && elementTakingHit.skills.shield.charges > 0) {
				elementTakingHit.skills.shield.charges -= 1;
				elementTakingHit.skills.shield.up = false;

				return Math.round(lifeModifierCurrent / elementTakingHit.skills.shield.reduceFactor); // Damage reduced by reduceFactor shield
			}

			if (lifeModifierCurrent > 0 && elementTakingHit._actions) {
				elementTakingHit._actions.isTakingDamage = true;
			}

			return lifeModifierCurrent;
		}

		return 0;
	};

	const checkElementCollisions = (_mapElement, _map) => {
		if (_mapElement.step) {
			// Only if element can move
			if (_mapElement.step.rangeLimit) {
				if (_mapElement.x < (_mapElement.step.rangeLimit.minX || 0) || _mapElement.x > (_mapElement.step.rangeLimit.maxX || $boxWidth)) {
					_mapElement.step.x = -_mapElement.step.x;
				}

				if (_mapElement.y < (_mapElement.step.rangeLimit.minY || 0) || _mapElement.y > (_mapElement.step.rangeLimit.maxY || $boxHeight)) {
					_mapElement.step.y = -_mapElement.step.y;
				}
			}

			checkMapBorderXCollision(_mapElement, _map);
			checkMapBorderYCollision(_mapElement, _map);
			const elementCollidedMapElement = checkMapElementCollision(_mapElement, _map, _mapElement.id);

			if (!isNaN(elementCollidedMapElement)) {
				// Decrease current checkElement life
				const bonusLifeModifier = (typeof elementCollidedMapElement === 'number' ? elementCollidedMapElement : 0);
				const lifeModifierCurrent = getElementLifeModifier(_mapElement, bonusLifeModifier);

				if (lifeModifierCurrent) {
					const resultLife = _mapElement.life - lifeModifierCurrent;
					_mapElement.life = (resultLife >= 0 ? resultLife : 0);
				}
			}
		}
	};

	const checkPlayerCollisions = (_player, _map) => {
		checkMapBorderXCollision(_player, _map);
		checkMapBorderYCollision(_player, _map);
		const playerCollidedMapElement = checkMapElementCollision(_player, _map);

		if (!isNaN(playerCollidedMapElement)) {
			// Decrease player life (the current checkElement)
			const bonusLifeModifier = (typeof playerCollidedMapElement === 'number' ? playerCollidedMapElement : 0);
			const lifeModifierCurrent = getElementLifeModifier(_player, bonusLifeModifier);

			if (lifeModifierCurrent) {
				const resultLife = _player.life - lifeModifierCurrent;

				_player.life = (resultLife >= 0 ? resultLife : 0);

				// Update menu screen
				setMenuScreen(_player, _map);
			}
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
			renderMap(_cx, _map);

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
		const elPlayerMenuCounter = document.querySelector('#screen > div#general > div#menu > div#bottom span#timer');

		// Check finite ammo
		const chekInfiniteAmmo = _player.skills && _player.skills.weapon && _player.skills.weapon.shoot && _player.skills.weapon.shoot.charges === -1;

		// Speed calc
		const playerSpeedStepX = Math.abs(_player.step.x);
		const playerSpeedStepY = Math.abs(_player.step.y);
		const playerSpeedFinal = Math.sqrt((playerSpeedStepX ** 2) + (playerSpeedStepY ** 2));

		const elMenuSpeedFinalShow = `${_numberFormatted(playerSpeedFinal, 1)} m/s`;

		// Player name
		elMenuPlayerName.textContent = _player.name;

		// Life
		elMenuPlayerLife.textContent = `❤️ ${_player.life}`;

		// Shoot
		elMenuPlayerShoot.textContent = `🔫 ${!chekInfiniteAmmo ? _player.skills.weapon.shoot.charges : '♾️'}`;

		// Shield
		elMenuPlayerShield.textContent = `🛡️ ${_player.skills.shield.charges}`;

		// Speed
		elMenuPlayerSpeed.textContent = `🏃💨 ${elMenuSpeedFinalShow}`;

		// Counter
		elPlayerMenuCounter.textContent = _timerFormatted(_map.timer);
	};

	// -----------------------------------------------------------------------------------------------
	// Base game
	// -----------------------------------------------------------------------------------------------

	// Globals
	let $debounceKeyDownHandler,
		$debounceKeyDownTimer,
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

		document.body.removeEventListener(
			'keydown',
			$debounceKeyDownHandler,
			false
		);

		gameOverMessage(_action, _cx, _player);
	};

	// Actually starts
	const beginGame = (_action, _canvas, _cx, _player, _map) => {
		$isOver = false;

		$boxWidth = _canvas.width;
		$boxHeight = _canvas.height;

		const debounceKeyDownWait = 50;

		$debounceKeyDownHandler = event => listeners.debounceKeyDownHandler(event, _player, _map, debounceKeyDownWait);

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
					_player.life--;
				}

				setMenuScreen(_player, _map);
			},
			1000
		);

		// Game keyboard listener
		document.body.addEventListener(
			'keydown',
			$debounceKeyDownHandler,
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
						id: '%elements.5.style.color.body',
						content: _cx => {
							const gradient = _cx.createLinearGradient(0, 0, 800, 800);
							gradient.addColorStop(0.5, 'green');
							gradient.addColorStop(1, 'purple');

							return gradient;
						},
						type: 6
					},
					{
						id: '%elements.6.style.color.body',
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
				1 - no collision, nothing happens
				2 - Happens collision -> persistent (keep movement - no damage)
				3 - Happens collision -> persistent (keep movement - receives damage)
				4 - Happens collision -> persistent (stop movement - no damage)
				5 - Happens collision -> persistent (stop movement - receives damage)
				6 - Happens collision -> persistent (revert movement - no damage)
				7 - Happens collision -> persistent (revert movement - receives damage)
				8 - Happens collision -> disappear on every collision - by a player or any element (except borders) - no damage
				9 - Happens collision -> disappear on every collision - by a player or any element (except borders) - receives damage
				10 - Happens collision -> disappear only if receives the collision - by a player or any element (except borders) - no damage
				11 - Happens collision -> disappear only if receives the collision - by a player or any element (except borders) - receives damage

			player starting point: 'mid' for middle screen ou number in pixels
		*/
		const maps = [
			{
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
						type: 7,
						width: 60,
						height: 260,
						x: 158,
						y: 198,
						style: {
							color: {
								body: 'black'
							}
						}
					},
					{
						id: 2,
						type: 7,
						width: 60,
						height: 255,
						// Em análise - rotate: 10,
						x: 150,
						y: 200,
						style: {
							color: {
								body: '%elements.2.style.color.body%'
							}
						}
					},
					{
						id: 3,
						type: 7,
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
						type: 7,
						width: 200,
						height: 50,
						x: 290,
						y: 550,
						style: {
							color: {
								body: 'red'
							}
						}
					},
					{
						id: 5,
						life: 1000,
						damageTakenFactor: 15,
						type: 3,
						width: 50,
						height: 50,
						x: 500,
						y: 500,
						style: {
							color: {
								body: '%elements.5.style.color.body',
								details: 'aquamarine'
							},
							currentDirection: 11
						},
						step: {
							x: -1,
							y: 2,
							rangeLimit: {
								maxX: 600,
								minY: 400
							}
						},
						_actions: {
							isTakingDamage: false
						}
					},
					{
						id: 6,
						life: 1500,
						damageTakenFactor: 20,
						type: 3,
						width: 50,
						height: 50,
						x: 900,
						y: 50,
						style: {
							color: {
								body: '%elements.6.style.color.body',
								details: 'darkorange'
							},
							currentDirection: 11
						},
						step: {
							x: 1,
							y: 1
						},
						hit: {
							bonusLifeModifier: 250
						},
						_actions: {
							isTakingDamage: false
						}
					},
					{
						id: 7,
						type: 7,
						width: 150,
						height: 150,
						x: 800,
						y: 150,
						style: {
							color: {
								body: 'tomato'
							}
						}
					},
					{
						id: 8,
						type: 7,
						radius: 60,
						x: 600,
						y: 280,
						style: {
							color: {
								body: 'pink'
							}
						}
					},
					{
						id: 8,
						type: 7,
						radius: 80,
						x: 950,
						y: 500,
						style: {
							color: {
								body: 'deepskyblue'
							}
						}
					},
					{
						id: 9,
						type: 7,
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
						id: 10,
						type: 11,
						width: 150,
						height: 10,
						x: 20,
						y: 95,
						style: {
							color: {
								body: 'darkgreen'
							}
						},
						step: {
							x: 5,
							y: 0
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
				const mapFillSpecial = _mapsFillSpecial[_mapId].fillers;
				const map = _maps[_mapId];

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
		getMapData(_cx, 0)
		.then(
			map => {
				// Initial map player coordinates
				const mapStartPointX = (
					map.players.startPointX === 'mid' ? (
						_canvas.width < _action.offsetWidth ? _canvas.width / 2 : _action.offsetWidth / 2
					) : (
						typeof map.players.startPointX === 'number' && !isNaN(map.players.startPointX) ? (
							map.players.startPointX
						) : (
							0
						)
					)
				);

				const mapStartPointY = (
					map.players.startPointY === 'mid' ? (
						_canvas.height < _action.offsetHeight ? _canvas.height / 2 : _action.offsetHeight / 2
					) : (
						typeof map.players.startPointY === 'number' && !isNaN(map.players.startPointY) ? (
							map.players.startPointY
						) : (
							0
						)
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
				name: 'Mike',
				life: 500,
				damageTakenFactor: 25,
				radius: 20,
				x: 0, // Initially added to mapStartPointX
				y: 0, // Initially added to mapStartPointY
				style: {
					color: {
						body: 'black',
						details: 'red'
					},
					currentDirection: 1
				},
				step: {
					x: 0,
					y: 0,
					increment: 1,
					xMax: 3,
					yMax: 3
				},
				skills: {
					shield: {
						shieldUpColor: 'lightcyan',
						up: false,
						reduceFactor: 2,
						charges: 10
					},
					weapon: {
						shoot: {
							isShootingColor: 'yellow',
							shootSpeed: 15,
							charges: 100, // -1 for infinite ammo
							baseElement : { // New element guide (basic data)
								type: 9,
								radius: 10, // Use always radius (for centering element performance)
								style: {
									color: {
										body: 'red'
									}
								},
								hit: {
									bonusLifeModifier: 50
								}
							}
						}
					}
				},
				_actions: {
					isTakingDamage: false,
					isShooting: false
				}
			}
		];

		return playersRepo;
	};

	const getPlayerData = playerId => {
		const players = playersRepo();
		return players[playerId];
	};

	const setPlayer = (_action, _canvas, _cx) => {
		const player = getPlayerData(0);
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

	// Load game
	const loadGame = () => {
		// Load listener
		document.body.addEventListener(
			'keypress',
			listeners.restartkeyPressHandler,
			false
		);

		startGame();
	};

	loadGame();
})();
