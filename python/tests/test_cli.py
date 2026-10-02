import socket
import unittest
from unittest import mock

from mineiro_osint import cli


class CliTests(unittest.TestCase):
    def test_free_port_skips_busy_port(self):
        with socket.socket() as busy:
            busy.bind(("127.0.0.1", 0))
            busy.listen(1)
            port = busy.getsockname()[1]
            self.assertNotEqual(cli._free_port("127.0.0.1", port), port)

    def test_find_node_rejects_old_system_node(self):
        with mock.patch("shutil.which", return_value="/usr/bin/node"), mock.patch.object(
            cli, "_node_version", return_value=(18, 0)
        ):
            found = cli.find_node()
        self.assertNotEqual(found, "/usr/bin/node")  # falls back to the pip-provided Node (or None)

    def test_find_node_accepts_supported_system_node(self):
        with mock.patch("shutil.which", return_value="/usr/bin/node"), mock.patch.object(
            cli, "_node_version", return_value=(22, 5)
        ):
            self.assertEqual(cli.find_node(), "/usr/bin/node")

    def test_check_fails_cleanly_without_bundle(self):
        with mock.patch.object(cli, "APP_DIR", cli.Path("/nonexistent")), mock.patch.object(
            cli, "find_node", return_value="/usr/bin/node"
        ):
            self.assertEqual(cli.main(["--check"]), 1)


if __name__ == "__main__":
    unittest.main()
