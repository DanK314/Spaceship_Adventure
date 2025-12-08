// ========= 1. Particle 클래스 =========
class Particle {
	constructor(x, y, radius, color, velocity) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.color = color;
		this.velocity = velocity; // {x, y} 객체
		this.alpha = 1; // 투명도 (사라지는 효과용)
	}

	update() {
		this.x += this.velocity.x;
		this.y += this.velocity.y;

		if (this.alpha > 0.001) {
			this.alpha -= 0.001;
		} else {
			this.alpha = 0;
		}
	}

	draw(ctx) {
		ctx.save();
		ctx.globalAlpha = this.alpha;
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
}

// ========= 2. Obstacle 클래스 =========
class Obstacle {
	constructor(x, y, w, h, speed) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.speed = speed;
		this.color = 'red';
		this.passed = false; // 점수 획득 여부
	}

	update() {
		this.x -= this.speed; // 왼쪽으로 이동
	}

	draw(ctx) {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.w, this.h);
	}

	getRect() {
		const padding = 5; // 충돌 판정 패딩
		return {
			x: this.x + padding,
			y: this.y + padding,
			w: this.w - padding * 2,
			h: this.h - padding * 2
		};
	}
}
// [수정됨] 앞으로 움직일 경로(예측선)를 미리 보여주는 운석
class CurvedObstacle extends Obstacle {
	constructor(x, y, w, h, speed) {
		super(x, y, w, h, speed);
		this.color = '#FF8800'; // 주황색
		this.centerY = y;
		this.angle = 0;
		this.angleSpeed = Math.random() < 0.5 ? 0.05 : -0.05 // 각도 변화 속도

		// 예측 경로를 얼마나 길게 보여줄지 (점의 개수)
		this.predictionSteps = 80;
		// 점들 사이의 간격 (값이 클수록 점이 듬성듬성 찍힘)
		this.stepGap = 1;
	}

	update() {
		this.x -= this.speed;

		// 위아래로 흔들리는 로직
		this.angle += this.angleSpeed;
		this.y = this.centerY + Math.sin(this.angle) * 100;
	}

	draw(ctx) {
		// 1. 예측 경로 그리기 (미래의 위치를 미리 계산)
		ctx.save();
		ctx.fillStyle = "#FFFFFF"; // 예측선은 흰색 점으로

		// 현재 위치부터 미래 위치들을 계산해서 점을 찍음
		for (let i = 1; i <= this.predictionSteps; i++) {
			// 미래 시점의 변수들 (i * gap 만큼 시간이 흐른 뒤)
			const futureIndex = i * this.stepGap;

			// X: 현재 속도만큼 왼쪽으로 이동
			const futureX = this.x - (this.speed * futureIndex);

			// Y: 현재 각도 속도(0.1)만큼 더해서 사인파 계산
			const futureAngle = this.angle + (this.angleSpeed * futureIndex);
			const futureY = this.centerY + Math.sin(futureAngle) * 100;

			// 투명도 조절 (멀리 있는 미래일수록 흐릿하게)
			ctx.globalAlpha = 1 - (i / this.predictionSteps);

			// 작은 점 그리기
			ctx.beginPath();
			// 운석의 중심점(this.h/2)에 맞춰서 점을 찍음
			ctx.arc(futureX + this.w / 2, futureY + this.h / 2, 2, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();

		// 2. 본체 그리기
		super.draw(ctx);
	}
}
// ========= 3. Player 클래스 =========
class Player {
	constructor(x, y, size, gravity, thrust) {
		this.x = x;
		this.y = y;
		this.w = size * 1.5; // width
		this.h = size; // height
		this.size = size; // 크기 (그리기용)
		this.g = gravity; // 중력
		this.thrust = thrust; // 상승력
		this.startY = y; // 리셋용 초기 Y위치

		this.velocity = 0; // 현재 수직 속도
	}

	update(isBoosting, gameHeight) {
		this.velocity += this.g;
		if (isBoosting) {
			this.velocity += this.thrust;
		}
		this.y += this.velocity;

		if (this.y < 0) {
			this.y = 0;
			this.velocity = 0;
		}
		if (this.y + this.h > gameHeight) {
			this.y = gameHeight - this.h;
			this.velocity = 0;
		}
	}

	draw(ctx) {
		const x = this.x;
		const y = this.y;
		const ex = this.x + 1.5 * this.size;
		const ey = this.y + this.size;
		const $ = this.size / 20;
		ctx.fillStyle = "#1010FF";
		ctx.fillRect(x + 15 * $, y + 9 * $, 5 * $, 5 * $);
		ctx.strokeStyle = "#FFFFFF";
		ctx.lineWidth = 2;
		ctx.fillStyle = "#CCCCFF";
		ctx.beginPath();
		ctx.moveTo(x, ey);
		ctx.lineTo(x, ey - 10 * $);
		ctx.lineTo(x + (3 * $), ey - (8 * $));
		ctx.lineTo(ex - (5 * $), ey - (8 * $));
		ctx.lineTo(ex, ey - 5 * $);
		ctx.lineTo(ex - 5 * $, ey - 2 * $);
		ctx.lineTo(x + (3 * $), ey - 2 * $);
		ctx.lineTo(x, ey);
		ctx.stroke();
		ctx.fill();
		ctx.fillStyle = "#EEEEFF55";
		ctx.beginPath();
		ctx.moveTo(x + 5 * $, y + 12 * $);
		ctx.lineTo(x + 5 * $, y + 5 * $);
		ctx.lineTo(x + 10 * $, y);
		ctx.lineTo(x + 20 * $, y);
		ctx.lineTo(x + 22.5 * $, y + 5 * $);
		ctx.lineTo(x + 22.5 * $, y + 12 * $);
		ctx.lineTo(x + 5 * $, y + 12 * $);
		ctx.stroke();
		ctx.fill();
		ctx.moveTo(x + 15 * $, y + 5 * $);
		ctx.beginPath();
		ctx.arc(x + 16 * $, y + 5 * $, 3 * $, Math.PI * 1.5, Math.PI * 2.1);
		ctx.stroke();
	}

	reset() {
		this.y = this.startY;
		this.velocity = 0;
	}

	getRect() {
		return { x: this.x, y: this.y, w: this.w, h: this.h };
	}
}

// ========= 4. Game 클래스 =========
class Game {
	constructor() {
		this.canvas = document.getElementById("gameCanvas");
		this.ctx = this.canvas.getContext("2d");
		this.sw = this.canvas.width;
		this.sh = this.canvas.height;

		this.scoreDisplay = document.getElementById("score");
		this.highScoreDisplay = document.getElementById("highScore");
		this.gameOverDisplay = document.getElementById("gameOver");
		this.restartBtn = document.getElementById("restartBtn");

		this.player = new Player(50, this.sh / 2 - 15, 30, 0.2, -0.4);

		this.obstacles = [];
		this.playerParticles = [];
		this.bgParticles = [];

		this.isBoosting = false;
		this.isGameOver = false;
		this.score = 0;
		this.highScore = 0;

		this.obstacleSpeed = 5;
		this.obstacleSpawnInterval = 2000;
		this.lastObstacleSpawn = 0;

		this.createBgParticles(100);

		this.bindEvents();

		// gameLoop를 'this'에 바인딩하여 컨텍스트 유지
		this.gameLoop = this.gameLoop.bind(this);
		this.start();
	}

	bindEvents() {
		document.addEventListener('keydown', this.handleInput.bind(this));
		document.addEventListener('keyup', this.handleInput.bind(this));
		this.canvas.addEventListener('mousedown', this.handleInput.bind(this));
		this.canvas.addEventListener('mouseup', this.handleInput.bind(this));
		this.restartBtn.addEventListener('click', this.start.bind(this));
	}

	handleInput(event) {
		if (this.isGameOver) return;
		if (event.code === 'Space') event.preventDefault();

		const isBoostStart = event.type === 'keydown' || event.type === 'mousedown';
		const isBoostEnd = event.type === 'keyup' || event.type === 'mouseup';

		if (isBoostStart) this.isBoosting = true;
		else if (isBoostEnd) this.isBoosting = false;
	}

	start() {
		this.isGameOver = false;
		this.score = 0;
		this.obstacles = [];
		this.playerParticles = [];
		this.player.reset();
		this.lastObstacleSpawn = Date.now();
		this.gameOverDisplay.style.display = 'none';
		this.updateScoreDisplay();
		this.obstacleSpeed = 5;

		// 멈췄던 루프를 다시 시작시킵니다.
		requestAnimationFrame(this.gameLoop);
	}

	gameLoop() {
		// 1. 배경 그리기 (검은색)
		this.ctx.fillStyle = 'black';
		this.ctx.fillRect(0, 0, this.sw, this.sh);

		// 2. 배경 파티클 처리 (업데이트 및 그리기)
		this.handleBgParticles();

		// 3. 플레이어 파티클 처리 (업데이트 및 그리기)
		this.handlePlayerParticles();

		// 4. 플레이어 그리기
		this.player.draw(this.ctx);

		// 5. 장애물 그리기
		this.obstacles.forEach(obs => obs.draw(this.ctx));

		// 6. 게임 오버가 아닐 때만 게임 로직 업데이트
		if (!this.isGameOver) {
			this.player.update(this.isBoosting, this.sh);
			this.spawnPlayerParticle();
			this.handleObstacles();
			this.checkCollisions();

			// [수정됨]
			// 루프를 if 블록 안으로 이동시켰습니다.
			// 게임 오버 상태가 되면 더 이상 이 코드가 실행되지 않아
			// 루프가 자연스럽게 멈춥니다.
			requestAnimationFrame(this.gameLoop);
		}

		this.score++;
		this.updateScoreDisplay();
	}

	// --- 파티클 관련 메서드 ---

	createBgParticles(count) {
		for (let i = 0; i < count; i++) {
			const x = Math.random() * this.sw;
			const y = Math.random() * this.sh;
			const radius = Math.random() * 1.5;
			const color = 'white';
			const velocity = { x: -Math.random() * 0.5 - 0.2, y: 0 };
			this.bgParticles.push(new Particle(x, y, radius, color, velocity));
		}
	}

	handleBgParticles() {
		this.bgParticles.forEach(p => {
			p.update();
			p.draw(this.ctx);
			if (p.x + p.radius < 0) {
				p.x = this.sw + p.radius;
				p.y = Math.random() * this.sh;
				p.alpha = 1;
			}
		});
	}

	spawnPlayerParticle() {

		const x = this.player.x;
		const y = this.player.y + this.player.h / 2 + this.player.h / 4 + (Math.random() - 0.5) * 10;
		const radius = Math.random() * 2 + 1;
		const color = '#ffffffff';
		const velocity = {
			x: Math.random() * -1 - 1,
			y: (Math.random() - 0.5) * 1
		};
		this.playerParticles.push(new Particle(x, y, radius, color, velocity));

	}

	handlePlayerParticles() {
		for (let i = this.playerParticles.length - 1; i >= 0; i--) {
			const p = this.playerParticles[i];
			p.update();
			p.draw(this.ctx);
			if (p.alpha === 0) {
				this.playerParticles.splice(i, 1);
			}
		}
	}

	// --- 장애물 및 게임 로직 메서드 ---

	handleObstacles() {
		const now = Date.now();

		if (now - this.lastObstacleSpawn > this.obstacleSpawnInterval) {
			this.lastObstacleSpawn = now;
			const Rand = Math.random();
			if (Rand < 0.2) {
				// ... (기존 코드)
				const w = 50; const h = w; const x = this.sw; let y;
				for (let index = 0; index < 3; index++) {
					y = Math.random() * (this.sh - h);
					this.obstacles.push(new Obstacle(x, y, w, h, this.obstacleSpeed));
				}
			} else if (Rand < 0.4) {
				// ... (기존 코드)
				const w = 100; const h = w; const x = this.sw; let y;
				for (let index = 0; index < 2; index++) {
					y = Math.random() * (this.sh - h);
					this.obstacles.push(new Obstacle(x, y, w, h, this.obstacleSpeed));
				}
			} else if (Rand < 0.6) {
				// ... (기존 코드)
				const w = 25; const h = w; const x = this.sw; let y;
				for (let index = 0; index < 5; index++) {
					y = Math.random() * (this.sh - h);
					if(this.score > 500 && Math.random() < 0.3) {
						this.obstacles.push(new CurvedObstacle(x, y, w, h, this.obstacleSpeed - 1));
					} else {
						this.obstacles.push(new Obstacle(x, y, w, h, this.obstacleSpeed));
					}
					
				}
			} else if (Rand < 0.8) {
				// ... (기존 코드)
				const w = 150; const h = w; const x = this.sw; let y;
				for (let index = 0; index < 1; index++) {
					y = Math.random() * (this.sh - h);
					this.obstacles.push(new Obstacle(x, y, w, h, this.obstacleSpeed));
				}
			} else {
				// [여기 수정됨] 마지막 10%: 작고 휘어지는 운석
				const w = 50; // 작게 설정
				const h = w;
				const x = this.sw;

				// 화면 위아래로 너무 벗어나지 않게 중앙 부근에서 생성
				const y = (this.sh / 4) + Math.random() * (this.sh / 2);

				// 일반 Obstacle 대신 CurvedObstacle 생성
				this.obstacles.push(new CurvedObstacle(x, y, w, h, this.obstacleSpeed + 1));
			}
		}

		// 장애물 업데이트 및 제거 로직은 기존과 동일
		for (let i = this.obstacles.length - 1; i >= 0; i--) {
			const obs = this.obstacles[i];
			obs.update();

			if (obs.x + obs.w < 0) {
				this.obstacles.splice(i, 1);
			}
		}
	}

	checkCollisions() {
		const playerRect = this.player.getRect();

		for (const obs of this.obstacles) {
			const obsRect = obs.getRect();

			if (
				playerRect.x < obsRect.x + obsRect.w &&
				playerRect.x + playerRect.w > obsRect.x &&
				playerRect.y < obsRect.y + obsRect.h &&
				playerRect.y + playerRect.h > obsRect.y
			) {
				this.endGame();
				return;
			}
		}
	}

	// Game 클래스 내부의 endGame 함수
	async endGame() {
		this.isGameOver = true;
		this.gameOverDisplay.style.display = 'block';

		if (this.score > this.highScore) {
			this.highScore = this.score;
			this.highScoreDisplay.textContent = 'High Score: ' + this.highScore;
			localStorage.setItem('myGameHighScore', this.highScore); // (하이스코어는 로컬에 저장)
		}

		const rankDisplay = document.getElementById("rankDisplay");
		rankDisplay.textContent = "Loading rank...";

		try {
			// ⚠️ YOUR_RENDER_URL은 실제 주소로 바꿔야 합니다!
			const response = await fetch('https://spaceship-adventure-server.onrender.com/submit', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},

				// [수정됨] 'player'를 전송하지 않고 'score'만 전송합니다.
				body: JSON.stringify({
					score: this.score
				})
			});

			if (!response.ok) throw new Error('Server response was not ok');

			const data = await response.json();

			rankDisplay.textContent = `Your Rank: ${data.rank} / ${data.total}`;

		} catch (error) {
			console.error('Failed to submit score:', error);
			rankDisplay.textContent = "Ranking unavailable";
		}
	}

	updateScoreDisplay() {
		this.scoreDisplay.textContent = 'Score: ' + this.score;
		if (this.score % 500 === 0 && this.obstacleSpeed < 10) {
			this.obstacleSpeed += 0.1;
			// 생성된 장애물들의 속도도 같이 업데이트 해줘야 자연스러움
			this.obstacles.forEach(obs => obs.speed = this.obstacleSpeed);
		}
	}
}

// HTML의 <canvas id="gameCanvas"> 태그가 로드된 후 게임 시작
document.addEventListener('DOMContentLoaded', () => {
	new Game();
});
