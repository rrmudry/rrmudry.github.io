export class Base {
    constructor(id, type, x, y) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.cooldownMs = 0;
        this.readyAt = 0;
    }

    draw(ctx) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x - 20, this.y - 20, 40, 20);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type.toUpperCase(), this.x, this.y - 25);
    }
}

export class Meteor {
    constructor(id, type, x, y, vx, vy, radius, splitCount, value) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.splitCount = splitCount;
        this.value = value;

        const distanceUnits = ['m', 'ft', 'km', 'mi'];
        const speedUnits = ['m/s', 'ft/s', 'km/h', 'mph'];
        const timeUnits = ['s', 'min', 'hr', 'day'];

        switch (type) {
            case 'distance':
                this.unit = distanceUnits[Math.floor(Math.random() * distanceUnits.length)];
                break;
            case 'speed':
                this.unit = speedUnits[Math.floor(Math.random() * speedUnits.length)];
                break;
            case 'time':
                this.unit = timeUnits[Math.floor(Math.random() * timeUnits.length)];
                break;
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.unit, this.x, this.y + this.radius + 15);
    }
}

export class Missile {
    constructor(id, baseId, type, x, y, vx, vy, targetX, targetY, targetMeteor = null) {
        this.id = id;
        this.baseId = baseId;
        this.type = type;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.targetX = targetX;
        this.targetY = targetY;
        this.targetMeteor = targetMeteor;
    }

    update(dt) {
        if (this.targetMeteor) {
            const dx = this.targetMeteor.x - this.x;
            const dy = this.targetMeteor.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            this.vx = (dx / dist) * speed;
            this.vy = (dy / dist) * speed;
            this.targetX = this.targetMeteor.x;
            this.targetY = this.targetMeteor.y;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Represents an explosion from a missile impact.
 */
export class Explosion {
    constructor(id, x, y, radius, maxRadius, growthRate, innerGrowthRate, ownerType) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = radius; // Outer radius
        this.innerRadius = 0; // Inner radius
        this.maxRadius = maxRadius;
        this.growthRate = growthRate;
        this.innerGrowthRate = innerGrowthRate;
        this.ownerType = ownerType;
        this.alive = true;
        this.growing = true;
    }

    update(dt) {
        if (this.growing) {
            this.radius += this.growthRate * dt;
            if (this.radius >= this.maxRadius) {
                this.radius = this.maxRadius;
                this.growing = false;
            }
        } else {
            // Once outer radius reached max, inner radius starts growing
            this.innerRadius += this.innerGrowthRate * dt;
            if (this.innerRadius >= this.radius) {
                this.alive = false; // Explosion dies when inner radius catches up to outer
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw inner circle to create a ring effect
        if (this.innerRadius > 0) {
            ctx.globalCompositeOperation = 'destination-out'; // This will "erase" pixels
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.innerRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over'; // Reset to default
        }
    }
}

export class PowerUp {
    constructor(id, type, x, y, vy, radius) {
        this.id = id;
        this.type = type; // 'extraLife', 'fastMissile', 'smartMissile'
        this.x = x;
        this.y = y;
        this.vy = vy;
        this.radius = radius;
        this.alive = true;
    }

    update(dt) {
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.type === 'extraLife') {
            ctx.fillText('L', this.x, this.y);
        } else if (this.type === 'fastMissile') {
            ctx.fillText('F', this.x, this.y);
        } else if (this.type === 'smartMissile') {
            ctx.fillText('S', this.x, this.y);
        }
    }
}