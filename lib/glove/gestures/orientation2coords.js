function orientation2Coords(quat)
{
    var x = 0, y = 0, z = -1;
    var qx = -quat[1], qy = quat[2], qz = -quat[0], qw = quat[3];

    var ix = qw * x + qy * z - qz * y;
    var iy = qw * y + qz * x - qx * z;
    var iz = qw * z + qx * y - qy * x;
    var iw = -qx * x - qy * y - qz * z;

    var result = [
        ix * qw + iw * -qx + iy * -qz - iz * -qy,
        iy * qw + iw * -qy + iz * -qx - ix * -qz,
        iz * qw + iw * -qz + ix * -qy - iy * -qx
    ];

    return result;
}
