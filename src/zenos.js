'use strict';

(function () {
	// -----------------------------------------------------------------------------------------------
	// Helpers
	// -----------------------------------------------------------------------------------------------

	// Generic game helpers

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
			date.toISOString().substr(12, 7)
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

	// Get element speed (if speed not defined, base 1)
	const _getElementSpeed = (_step, _stepSpeed = 1) => (
		Math.floor((_step || 0) * (_stepSpeed || 1))
	);

	// Check if map border is close enough
	const _checkScreenBorders = _side => (
		Math.round(_side / 2)
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
						const newShootData = (_player.skills && _player.skills.weapon && _player.skills.weapon.shoot && typeof _player.skills.weapon.shoot === 'object') ? (
							{ ..._player.skills.weapon.shoot }
						) : (
							undefined
						);

						if (newShootData && _player.skills.weapon.shoot.personal) {
							const chekInfiniteAmmo = _player.skills.weapon.shoot.personal.charges === -1;
							const chargesLeft = !chekInfiniteAmmo && _player.skills.weapon.shoot.personal.charges;

							if (chekInfiniteAmmo || chargesLeft > 0) {
								const currentPlayerDirection = _getElementDirection(_player);

								const checkDirectionXpositive = [-9, 1, 11].includes(currentPlayerDirection);
								const checkDirectionXnegative = [-11, -1, 9].includes(currentPlayerDirection);
								const checkDirectionYpositive = [9, 10, 11].includes(currentPlayerDirection);
								const checkDirectionYnegative = [-11, -10, -9].includes(currentPlayerDirection);

								const secureColisionValue = Math.round(_player.radius * 1.5);

								const shootDataX = checkDirectionXpositive ? (
									_player.x + secureColisionValue
								) : (
									checkDirectionXnegative ? (
										_player.x - secureColisionValue
									) : (
										_player.x
									)
								);

								const shootDataY = checkDirectionYpositive ? (
									_player.y + secureColisionValue
								) : (
									checkDirectionYnegative ? (
										_player.y - secureColisionValue
									) : (
										_player.y
									)
								);

								const shootStepX = (_player.step.x > 0 || checkDirectionXpositive) ? (
									newShootData.personal.shootSpeed
								) : (
									(_player.step.x < 0 || checkDirectionXnegative) ? (
										newShootData.personal.shootSpeed * -1
									) : (
										0
									)
								);

								const shootStepY = (_player.step.y > 0 || checkDirectionYpositive) ? (
									newShootData.personal.shootSpeed
								) : (
									(_player.step.y < 0 || checkDirectionYnegative) ? (
										newShootData.personal.shootSpeed * -1
									) : (
										0
									)
								);

								delete newShootData.personal; // Not needed for the map element

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

								_map.elements.push({ ...newShootData, ...newShootDataAttach });

								_player.skills.weapon.shoot.personal.isShooting = true;

								if (!chekInfiniteAmmo) {
									_player.skills.weapon.shoot.personal.charges -= 1;
								}
							}
						}

						break;
					}
					case ' ': {
						if (_player.step.x !== 0) {
							_player.x += _player.step.x;
							_player.step.x = 0;
						}

						if (_player.step.y !== 0) {
							_player.y += _player.step.y;
							_player.step.y = 0;
						}

						break;
					}
					case 'up':
					case 'ArrowUp': {
						if (_player.step.y < 0) {
							_player.step.x = 0;
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
				setMenuScreen(_player);
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
				const speedStepX = _getElementSpeed(_mapElement.step.x, _mapElement.step.speed);
				_mapElement.x += speedStepX;
			}
		}

		if (_mapElement.step && _mapElement.step.y) {
			if (_mapElement.step.y !== 0) {
				const speedStepY = _getElementSpeed(_mapElement.step.y, _mapElement.step.speed);
				_mapElement.y += speedStepY;
			}
		}
	};

	const drawMapElements = (_cx, _map) => {
		// Elements for base screen

		for (const mapElement of _map.elements) {
			// Movement (if applicable)
			moveMapElement(mapElement);

			// Colisions
			checkElementColisions(mapElement, _map);

			// Element direction (if applicable)
			const currentElementDirection = _getElementDirection(mapElement);

			// Drawn element body (direction if applicable)
			_drawnElement(_cx, mapElement, currentElementDirection);
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
				const speedStepX = _getElementSpeed(_player.step.x, _player.step.speed);

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
				const speedStepY = _getElementSpeed(_player.step.y, _player.step.speed);

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
			// Weapon shoot
			if (_player.skills.weapon.shoot.personal.isShooting) {
				_player.style.color.saved = _player.style.color.details; // Temporary
				_player.style.color.details = _player.skills.weapon.shoot.personal.colorWhenShooting;

				_player.skills.weapon.shoot.personal.isShooting = false;
			} else {
				if (_player.style.color.saved) {
					_player.style.color.details = _player.style.color.saved;
					delete _player.style.color.saved;
				}
			}

			// Shield
			if (_player.skills.shield.up && _player.skills.shield.charges > 0) {
				_cx.save();

				_cx.lineWidth = 1;

				_cx.beginPath();
				_cx.arc(_player.x, _player.y, _player.radius * 1.5, 0, 2 * Math.PI);
				_cx.strokeStyle = _player.skills.shield.color;
				_cx.stroke();
				_cx.closePath();

				_cx.restore();
			}
		};

		// Movement
		movePlayer(_action, _player);

		// Colisions
		checkPlayerColisions(_player, _map);

		// Player direction
		const currentPlayerDirection = _getElementDirection(_player);

		// Drawn player body and direction
		_drawnElement(_cx, _player, currentPlayerDirection);

		// Drawn player details (shield)
		_drawnPlayerDetails(_cx, _player);
	};

	// -----------------------------------------------------------------------------------------------
	// Colisions
	// -----------------------------------------------------------------------------------------------

	const colisionActions = (_checkElement, _mapElement, _mapElements, _idActiveElement, _aidValues, phase) => {
		let willModifyPlayerLife = false;

		if (_checkElement.type && _checkElement.type === 2) { // Remove active item
			const itemToRemove = _mapElements.findIndex(item => item.id === _idActiveElement);

			if (itemToRemove !== -1) {
				_mapElements.splice(itemToRemove, 1);
			}
		}

		switch (_mapElement.type) {
			case 1: { // Revert movement
				switch (phase) {
					case 1: {
						const baseMapElementDistanceX = _mapElement.radius ? _mapElement.radius : _mapElement.width;

						_checkElement.step.x = -_checkElement.step.x;
						_checkElement.x = _aidValues.groupedXBackward + baseMapElementDistanceX;

						break;
					}
					case 2: {
						_checkElement.step.x = -_checkElement.step.x;
						_checkElement.x = _aidValues.groupedXFoward;

						break;
					}
					case 3: {
						const baseMapElementDistanceY = _mapElement.radius ? _mapElement.radius : _mapElement.height;

						_checkElement.step.y = -_checkElement.step.y;
						_checkElement.y = _aidValues.groupedYBackward + baseMapElementDistanceY;

						break;
					}
					case 4: {
						_checkElement.step.y = -_checkElement.step.y;
						_checkElement.y = _aidValues.groupedYFoward;

						break;
					}
				}

				willModifyPlayerLife = true;

				break;
			}
			case 2:
			case 3:
			case 4:
			case 5: { // Remove item
				const itemToRemove = _mapElements.findIndex(item => item.id === _mapElement.id);

				if (_mapElement.type === 2 || _mapElement.type === 3 || (!_checkElement.type || _mapElement.type <= _checkElement.type)) {
					if (itemToRemove !== -1) {
						_mapElements.splice(itemToRemove, 1);
					}
				}

				willModifyPlayerLife = true;

				break;
			}
		}

		return willModifyPlayerLife;
	};

	const checkMapBorderXColision = (checkElement, _map) => {
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

	const checkMapBorderYColision = (checkElement, _map) => {
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

	const checkMapElementColision = (checkElement, _map, _idActiveElement = null) => {
		const _getAidValues = (_checkElement, _mapElement) => {
			const aidValues = {};

			const baseCheckElementDistanceX = _checkElement.radius ? _checkElement.radius : (_checkElement.step.x > 0 ? _checkElement.width : 0);
			const baseCheckElementDistanceY = _checkElement.radius ? _checkElement.radius : (_checkElement.step.y > 0 ? _checkElement.height : 0);

			// -X
			aidValues.groupedXBackward = _mapElement.x + baseCheckElementDistanceX;

			aidValues.groupedXBackwardComplement = _mapElement.radius ? (
				aidValues.groupedXBackward + _mapElement.radius
			) : (
				aidValues.groupedXBackward + _mapElement.width
			);

			// +X
			aidValues.groupedXFoward = _mapElement.radius ? (
				_mapElement.x - baseCheckElementDistanceX - _mapElement.radius
			) : (
				_mapElement.x - baseCheckElementDistanceX
			);

			aidValues.groupedXFowardComplement = _mapElement.radius ? (
				aidValues.groupedXFoward + _mapElement.radius
			) : (
				aidValues.groupedXFoward + _mapElement.width
			);

			// -Y
			aidValues.groupedYBackward = _mapElement.y + baseCheckElementDistanceY;

			aidValues.groupedYBackwardComplement = _mapElement.radius ? (
				aidValues.groupedYBackward + _mapElement.radius
			) : (
				aidValues.groupedYBackward + _mapElement.height
			);

			// +Y
			aidValues.groupedYFoward = _mapElement.radius ? (
				_mapElement.y - baseCheckElementDistanceY - _mapElement.radius
			) : (
				_mapElement.y - baseCheckElementDistanceY
			);

			aidValues.groupedYFowardComplement = _mapElement.radius ? (
				aidValues.groupedYFoward + _mapElement.radius
			) : (
				aidValues.groupedYFoward + _mapElement.height
			);

			return aidValues;
		};

		const _checkAtX = (_checkElement, _mapElement, _mapElements, _idActiveElement) => {
			const aidValuesAtX = _getAidValues(_checkElement, _mapElement);

			const secureColisionValue = Math.abs(_getElementSpeed(_checkElement.step.y, _checkElement.step.speed)) + (_checkElement.step.speed || 1);
			const secureBorder = secureColisionValue < (_mapElement.height || _mapElement.radius) ? secureColisionValue : (_mapElement.height || _mapElement.radius);

			const goCheckRangeY = (
				_checkElement.radius ? (
					_mapElement.radius ? (
						!(_checkElement.y > _mapElement.y + _checkElement.radius + _mapElement.radius - secureBorder || _checkElement.y < _mapElement.y - _checkElement.radius - _mapElement.radius + secureBorder)
					) : (
						!(_checkElement.y > _mapElement.y + _checkElement.radius + _mapElement.height - secureBorder || _checkElement.y < _mapElement.y - _checkElement.radius + secureBorder)
					)
				) : (
					_mapElement.radius ? (
						!(_checkElement.y > _mapElement.y + _mapElement.radius - secureBorder || _checkElement.y < _mapElement.y - _mapElement.radius - _checkElement.height + secureBorder)
					) : (
						!(_checkElement.y > _mapElement.y + _mapElement.height - secureBorder || _checkElement.y < _mapElement.y - _checkElement.height + secureBorder)
					)
				)
			);

			if (goCheckRangeY) {
				const bonusLifeModifier = (
					_mapElement.hit && typeof _mapElement.hit.bonusLifeModifier === 'number' && !isNaN(_mapElement.hit.bonusLifeModifier) && _mapElement.hit.bonusLifeModifier
				) || (
					0
				);

				if (_checkElement.step.x < 0 || (_checkElement.step.x === 0 && (_mapElement.step && (_mapElement.step.x || 0) > 0))) {
					const goCheckColisionXBackward = (
						_checkElement.x <= aidValuesAtX.groupedXBackwardComplement && _checkElement.x > aidValuesAtX.groupedXBackward
					);

					if (goCheckColisionXBackward) {
						// Colided
						const willModifyPlayerLife = colisionActions(_checkElement, _mapElement, _mapElements, _idActiveElement, aidValuesAtX, 1);

						if (willModifyPlayerLife) {
							return bonusLifeModifier;
						}
					}
				} else {
					const goCheckColisionXFoward = (
						_checkElement.x >= aidValuesAtX.groupedXFoward && _checkElement.x + secureBorder <= aidValuesAtX.groupedXFowardComplement
					);

					if (goCheckColisionXFoward) {
						// Colided
						const willModifyPlayerLife = colisionActions(_checkElement, _mapElement, _mapElements, _idActiveElement, aidValuesAtX, 2);

						if (willModifyPlayerLife) {
							return bonusLifeModifier;
						}
					}
				}
			}

			return NaN;
		};

		const _checkAtY = (_checkElement, _mapElement, _mapElements, _idActiveElement) => {
			const aidValuesAtY = _getAidValues(_checkElement, _mapElement);

			const secureColisionValue = Math.abs(_getElementSpeed(_checkElement.step.x, _checkElement.step.speed)) + (_checkElement.step.speed || 1);
			const secureBorder = secureColisionValue < (_mapElement.width || _mapElement.radius) ? secureColisionValue : (_mapElement.width || _mapElement.radius);

			const goCheckRangeX = (
				_checkElement.radius ? (
					_mapElement.radius ? (
						!(_checkElement.x > _mapElement.x + _checkElement.radius + _mapElement.radius - secureBorder || _checkElement.x < _mapElement.x - _checkElement.radius - _mapElement.radius + secureBorder)
					) : (
						!(_checkElement.x > _mapElement.x + _checkElement.radius + _mapElement.width - secureBorder || _checkElement.x < _mapElement.x - _checkElement.radius + secureBorder)
					)
				) : (
					_mapElement.radius ? (
						!(_checkElement.x > _mapElement.x + _mapElement.radius - secureBorder || _checkElement.x < _mapElement.x - _mapElement.radius - _checkElement.width + secureBorder)
					) : (
						!(_checkElement.x > _mapElement.x + _mapElement.width - secureBorder || _checkElement.x < _mapElement.x - _checkElement.width + secureBorder)
					)
				)
			);

			if (goCheckRangeX) {
				const bonusLifeModifier = (
					_mapElement.hit && typeof _mapElement.hit.bonusLifeModifier === 'number' && !isNaN(_mapElement.hit.bonusLifeModifier) && _mapElement.hit.bonusLifeModifier
				) || (
					0
				);

				if (_checkElement.step.y < 0 || (_checkElement.step.y === 0 && (_mapElement.step && (_mapElement.step.y || 0) > 0))) {
					const goCheckColisionYBackward = (
						_checkElement.y <= aidValuesAtY.groupedYBackwardComplement && _checkElement.y > aidValuesAtY.groupedYBackward
					);

					if (goCheckColisionYBackward) {
						// Colided
						const willModifyPlayerLife = colisionActions(_checkElement, _mapElement, _mapElements, _idActiveElement, aidValuesAtY, 3);

						if (willModifyPlayerLife) {
							return bonusLifeModifier;
						}
					}
				} else {
					const goCheckColisionYFoward = (
						_checkElement.y >= aidValuesAtY.groupedYFoward && _checkElement.y + secureBorder <= aidValuesAtY.groupedYFowardComplement
					);

					if (goCheckColisionYFoward) {
						// Colided
						const willModifyPlayerLife = colisionActions(_checkElement, _mapElement, _mapElements, _idActiveElement, aidValuesAtY, 4);

						if (willModifyPlayerLife) {
							return bonusLifeModifier;
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

	const checkElementColisions = (_mapElement, _map) => {
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

			checkMapBorderXColision(_mapElement, _map);
			checkMapBorderYColision(_mapElement, _map);
			checkMapElementColision(_mapElement, _map, _mapElement.id);
		}
	};

	// Calculate players new modified life
	const getPlayerLifeModifier = (_player, bonusLifeModifier) => {
		const lifeModifierCurrent = (
			bonusLifeModifier < 0 ? ( // Player gain life
				bonusLifeModifier
			) : ( // Player lose life
				(_player.damageTakenFactor - _randomIntFromInterval(1, _player.damageTakenFactor - 1)) + bonusLifeModifier
			)
		);

		if (lifeModifierCurrent >= 0 && _player.skills.shield.up && _player.skills.shield.charges > 0) {
			_player.skills.shield.charges -= 1;
			_player.skills.shield.up = false;

			return Math.round(lifeModifierCurrent / _player.skills.shield.reduceFactor); // Player damage reduced by reduceFactor shield
		}

		return lifeModifierCurrent;
	};

	const checkPlayerColisions = (_player, _map) => {
		const playerColidedMapBorderX = checkMapBorderXColision(_player, _map);
		const playerColidedMapBorderY = checkMapBorderYColision(_player, _map);
		const playerColidedMapElement = checkMapElementColision(_player, _map);

		if (playerColidedMapBorderX || playerColidedMapBorderY || !isNaN(playerColidedMapElement)) {
			// Decrease life
			const bonusLifeModifier = (typeof playerColidedMapElement === 'number' && !isNaN(playerColidedMapElement)) ? playerColidedMapElement : 0;
			const resultLife = _player.life - getPlayerLifeModifier(_player, bonusLifeModifier);

			_player.life = (resultLife >= 0 ? resultLife : 0);

			// Update menu screen
			setMenuScreen(_player);
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

	const setMenuScreen = _player => {
		// Top
		const elMenuPlayerName = document.querySelector('#screen > div#general > div#menu > div#top span#player-name');
		const elMenuPlayerLife = document.querySelector('#screen > div#general > div#menu > div#top span#life');
		const elMenuPlayerShoot = document.querySelector('#screen > div#general > div#menu > div#top span#shoot');
		const elMenuPlayerShield = document.querySelector('#screen > div#general > div#menu > div#top span#shield');
		const elMenuPlayerSpeed = document.querySelector('#screen > div#general > div#menu > div#top span#speed');

		// Bottom
		const elPlayerMenuCounter = document.querySelector('#screen > div#general > div#menu > div#bottom span#timer');

		// Check finite ammo
		const chekInfiniteAmmo = _player.skills && _player.skills.weapon && _player.skills.weapon.shoot && _player.skills.weapon.shoot.personal && _player.skills.weapon.shoot.personal.charges === -1;

		// Speed calc
		const playerSpeedStepX = Math.abs(_getElementSpeed(_player.step.x, _player.step.speed));
		const playerSpeedStepY = Math.abs(_getElementSpeed(_player.step.y, _player.step.speed));
		const playerSpeedFinal = Math.sqrt((playerSpeedStepX ** 2) + (playerSpeedStepY ** 2));

		const elMenuSpeedFinalShow = `${_numberFormatted(playerSpeedFinal, 1)} m/s`;

		// Player name
		elMenuPlayerName.textContent = _player.name;

		// Life
		elMenuPlayerLife.textContent = `❤️ ${_player.life}`;

		// Shoot
		elMenuPlayerShoot.textContent = `🔫 ${!chekInfiniteAmmo ? _player.skills.weapon.shoot.personal.charges : '♾️'}`;

		// Shield
		elMenuPlayerShield.textContent = `🛡️ ${_player.skills.shield.charges}`;

		// Speed
		elMenuPlayerSpeed.textContent = `🏃💨 ${elMenuSpeedFinalShow}`;

		// Counter
		elPlayerMenuCounter.textContent = _timerFormatted(_player.timer);
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

		const startPointX = (
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

		const startPointY = (
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
		_cx.fillText('Game Over', startPointX, startPointY);
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
		setMenuScreen(_player);

		$intervalTimer = setInterval(
			() => {
				_player.timer++;

				if (_player.timer % 5 === 0) { // Decrease life over time
					_player.life--;
				}

				setMenuScreen(_player);
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
				0 - no colision, no disappear
				1 - Happens colision -> persistent (revert movement)
				2 - Happens colision -> disappear on every colision - take and receive - by a player or any element (except borders)
				3 - Happens colision -> disappear only if receives the colision by a player or any element (except borders)
				4 - Happens colision -> disappear only if receives the colision by a player, type 4 or 5 (except borders)
				5 - Happens colision -> disappear only if receives the colision by a player or type 5 (except borders)

			player starting point: 'mid' for middle screen ou number in pixels
		*/
		const maps = [
			{
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
						type: 1,
						width: 80,
						height: 310,
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
						type: 1,
						width: 80,
						height: 305,
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
						type: 1,
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
						type: 1,
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
						type: 3,
						width: 150,
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
							x: 2,
							y: 3,
							rangeLimit: {
								maxX: 800,
								minY: 200
							}
						}
					},
					{
						id: 6,
						type: 3,
						width: 10,
						height: 60,
						x: 490,
						y: 170,
						style: {
							color: {
								body: '%elements.6.style.color.body',
								details: 'darkorange'
							},
							currentDirection: 11
						},
						step: {
							x: 1,
							y: 3
						},
						hit: {
							bonusLifeModifier: 250
						}
					},
					{
						id: 7,
						type: 1,
						width: 20,
						height: 100,
						x: 700,
						y: 200,
						style: {
							color: {
								body: 'tomato'
							}
						}
					},
					{
						id: 8,
						type: 1,
						radius: 40,
						x: 650,
						y: 150,
						style: {
							color: {
								body: 'pink'
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
				const startPointX = (
					map.players.startPointX === 'mid' ? (
						_canvas.width < _action.offsetWidth ? _canvas.width / 2 : _action.offsetWidth / 2
					) : (
						typeof map.players.startPointX === 'number' && !isNaN(map.players.startPointX) ? (
							map.players.startPointX
						) : (
							200
						)
					)
				);

				const startPointY = (
					map.players.startPointY === 'mid' ? (
						_canvas.height < _action.offsetHeight ? _canvas.height / 2 : _action.offsetHeight / 2
					) : (
						typeof map.players.startPointY === 'number' && !isNaN(map.players.startPointY) ? (
							map.players.startPointY
						) : (
							200
						)
					)
				);

				_player.x = startPointX;
				_player.y = startPointY;

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
				timer: 0,
				radius: 20,
				x: 200,
				y: 200,
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
					yMax: 3,
					speed: 1
				},
				skills: {
					shield: {
						color: 'lightcyan',
						up: false,
						charges: 10,
						reduceFactor: 2
					},
					weapon: {
						shoot: {
							type: 2,
							radius: 15,
							style: {
								color: {
									body: 'red'
								}
							},
							hit: {
								bonusLifeModifier: 50
							},
							personal: {
								isShooting: false,
								colorWhenShooting: 'yellow',
								shootSpeed: 10,
								charges: 100 // -1 for infinite ammo
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
