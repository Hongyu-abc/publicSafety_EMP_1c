"""The homework's Number wrapper and recursive chain rule."""
from operations import Add, Subtract, Multiply, Divide


class Number:
    def __init__(self, data, creator=None):
        self.data = float(data)
        self.creator = creator
        self.grad = None

    @staticmethod
    def _op(Op, a, b):
        a = a if isinstance(a, Number) else Number(a)
        b = b if isinstance(b, Number) else Number(b)
        f = Op()
        return Number(f(a, b), creator=f)

    def __add__(self, other):
        return self._op(Add, self, other)

    __radd__ = __add__

    def __sub__(self, other):
        return self._op(Subtract, self, other)

    def __rsub__(self, other):
        return self._op(Subtract, other, self)

    def __mul__(self, other):
        return self._op(Multiply, self, other)

    __rmul__ = __mul__

    def __truediv__(self, other):
        return self._op(Divide, self, other)

    def backprop(self, grad=1):
        self.grad = grad if self.grad is None else self.grad + grad
        if self.creator is not None:
            self.creator.backprop(grad)

    def null_gradients(self):
        self.grad = None
        if self.creator is not None:
            self.creator.a.null_gradients()
            self.creator.b.null_gradients()
